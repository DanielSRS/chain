/**
 * Mouse Events Module.
 *
 * This module provides functionality for handling mouse events in terminal applications.
 */

import { Logger } from './utils.js';

/**
 * Interface for MouseEvent properties
 */
export interface MouseEvent {
  name: 'mouse';
  sequence: string;
  x: number;
  y: number;
  scroll: number;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  release: boolean;
  // Add the new properties for movement tracking
  isMotion: boolean;
  isHover: boolean;
  button?: number;
}

let MostRecentMouseEventEmitedTime = 100000;

/**
 * Chege if mouse event was emitted in the last 10ms
 *
 * @returns true if a mouse event was emitted recently
 */
export function hasMouseEventEmitedRecently(): boolean {
  return Date.now() - MostRecentMouseEventEmitedTime < 10;
}

/**
 * Extended interface for streams that have mousepress listeners
 */
export interface MouseAwareStream extends NodeJS.ReadableStream {
  encoding?: BufferEncoding;
  emit(event: 'mousepress', data: MouseEvent): boolean;
  emit(event: 'data', data: Buffer | string): boolean;
  on(event: 'mousepress', listener: (data: MouseEvent) => void): this;
  on(event: 'data', listener: (data: Buffer | string) => void): this;
}

/**
 * Mouse tracking modes
 */
export enum MouseMode {
  /**
   * Basic mouse button events only (press and release)
   */
  BUTTON = 1000,

  /**
   * Mouse movement while buttons are pressed
   */
  MOTION = 1002,

  /**
   * All mouse movement (including hovering without buttons)
   */
  ANY = 1003,
}

/**
 * Mouse encoding modes
 */
export enum MouseEncoding {
  /**
   * Default X11 encoding (limited to coordinates < 223)
   */
  DEFAULT = 0,

  /**
   * UTF8 mouse encoding (works with non-ASCII characters)
   */
  UTF8 = 1005,

  /**
   * SGR mouse encoding (supports coordinates > 223)
   */
  SGR = 1006,

  /**
   * URXVT mouse encoding (alternate extended encoding)
   */
  URXVT = 1015,
}

/**
 * Enables specific mouse event tracking mode on the output stream.
 *
 * @param stream writable stream instance
 * @param mode tracking mode to enable
 */
export function enableMouseMode(
  stream: NodeJS.WritableStream,
  mode: MouseMode,
): void {
  stream.write(`\x1b[?${mode}h`);
}

/**
 * Disables specific mouse event tracking mode on the output stream.
 *
 * @param stream writable stream instance
 * @param mode tracking mode to disable
 */
export function disableMouseMode(
  stream: NodeJS.WritableStream,
  mode: MouseMode,
): void {
  stream.write(`\x1b[?${mode}l`);
}

/**
 * Enables specific mouse encoding mode on the output stream.
 *
 * @param stream writable stream instance
 * @param mode encoding mode to enable
 */
export function enableMouseEncoding(
  stream: NodeJS.WritableStream,
  mode: MouseEncoding,
): void {
  if (mode !== MouseEncoding.DEFAULT) {
    stream.write(`\x1b[?${mode}h`);
  }
}

/**
 * Disables specific mouse encoding mode on the output stream.
 *
 * @param stream writable stream instance
 * @param mode encoding mode to disable
 */
export function disableMouseEncoding(
  stream: NodeJS.WritableStream,
  mode: MouseEncoding,
): void {
  if (mode !== MouseEncoding.DEFAULT) {
    stream.write(`\x1b[?${mode}l`);
  }
}

/**
 * Enables "mousepress" events on the *input* stream. Note that `stream` must be
 * an *output* stream (i.e. a Writable Stream instance), usually `process.stdout`.
 *
 * @param stream writable stream instance
 */
export function enableMouse(stream: NodeJS.WritableStream): void {
  // Default to button events only for backward compatibility
  enableMouseMode(stream, MouseMode.BUTTON);
}

/**
 * Enables mouse motion tracking (movement while buttons are pressed)
 *
 * @param stream writable stream instance
 */
export function enableMouseMotion(stream: NodeJS.WritableStream): void {
  enableMouseMode(stream, MouseMode.MOTION);
}

/**
 * Enables all mouse movement tracking, including hover (movement without buttons)
 *
 * @param stream writable stream instance
 */
export function enableMouseAny(stream: NodeJS.WritableStream): void {
  enableMouseMode(stream, MouseMode.ANY);
}

/**
 * Enable all mouse modes with extended encoding
 *
 * This sets up full mouse tracking with SGR encoding, which:
 * 1. Allows for coordinates beyond the 223 limit of the default encoding
 * 2. Properly reports mouse release events
 * 3. Works with larger terminal screens
 *
 * @param stream writable stream instance
 */
export function enableFullMouseSupport(stream: NodeJS.WritableStream): void {
  // First enable SGR encoding mode (best extended mode)
  enableMouseEncoding(stream, MouseEncoding.SGR);

  // Then enable all mouse events (movement, hover, etc)
  enableMouseMode(stream, MouseMode.ANY);
}

/**
 * Disable all mouse modes and encodings
 *
 * @param stream writable stream instance
 */
export function disableFullMouseSupport(stream: NodeJS.WritableStream): void {
  // Disable all tracking modes
  disableMouseMode(stream, MouseMode.BUTTON);
  disableMouseMode(stream, MouseMode.MOTION);
  disableMouseMode(stream, MouseMode.ANY);

  // Disable all encoding modes
  disableMouseEncoding(stream, MouseEncoding.UTF8);
  disableMouseEncoding(stream, MouseEncoding.SGR);
  disableMouseEncoding(stream, MouseEncoding.URXVT);
}

/**
 * Disables "mousepress" events from being sent to the *input* stream.
 * Note that `stream` must be an *output* stream (i.e. a Writable Stream instance),
 * usually `process.stdout`.
 *
 * @param stream writable stream instance
 */
export function disableMouse(stream: NodeJS.WritableStream): void {
  // Disable all mouse tracking modes
  disableMouseMode(stream, MouseMode.BUTTON);
  disableMouseMode(stream, MouseMode.MOTION);
  disableMouseMode(stream, MouseMode.ANY);
}

/**
 * Parses mouse events from input stream and emits them as 'mousepress' events.
 * Supports multiple mouse protocols:
 * - X11 Mouse Protocol: \x1b[M followed by three bytes
 * - SGR Mouse Protocol: \x1b[<num;num;numM or \x1b[<num;num;numm
 * - URXVT Mouse Protocol: \x1b[num;num;numM
 *
 * @param stream readable stream instance
 * @param input input data to parse
 * @returns true if a mouse event was detected and emitted, false otherwise
 */
export function parseMouseEvents(
  stream: MouseAwareStream,
  input: string | Buffer,
): boolean {
  if (Buffer.isBuffer(input)) {
    input = input.toString(stream.encoding || 'utf-8');
  }

  // Initialize a MouseEvent object with default values
  const key: MouseEvent = {
    name: 'mouse',
    sequence: input,
    x: 0,
    y: 0,
    scroll: 0,
    ctrl: false,
    meta: false,
    shift: false,
    release: false,
    isMotion: false,
    isHover: false,
  };

  // Check for X11 mouse protocol: ESC [ M <three bytes>
  if (input.length >= 6 && input.substring(0, 3) === '\x1b[M') {
    const b = input.charCodeAt(3);
    key.x = input.charCodeAt(4) - 0o40;
    key.y = input.charCodeAt(5) - 0o40;

    // Control keys
    key.ctrl = !!((1 << 4) & b);
    key.meta = !!((1 << 3) & b);
    key.shift = !!((1 << 2) & b);

    // Bits 0-1: button (0=left, 1=middle, 2=right, 3=release)
    // Bit 2: shift
    // Bit 3: meta (alt)
    // Bit 4: control
    // Bit 5: motion flag
    // Bit 6: scroll flag (wheel up/down or fifth/sixth button)

    // Detect motion events (bit 5 set)
    key.isMotion = !!((1 << 5) & b);

    // Determine button state (bits 0-1)
    const buttonState = b & 3;
    key.release = buttonState === 3;

    // For motion events:
    // - If button state is 3 (no button pressed) and motion flag is set,
    //   it's a hover event (MOUSE_ANY mode)
    key.isHover = key.isMotion && buttonState === 3;

    // Handle scroll events (bit 6)
    if ((1 << 6) & b) {
      // Bit 0 determines scroll direction
      key.scroll = 1 & b ? 1 : -1;
    }

    // Set button number only if it's a press or motion with button pressed
    if (!key.release && !key.scroll) {
      key.button = buttonState;
    }

    // Emit the mouse event
    stream.emit('mousepress', key);
    MostRecentMouseEventEmitedTime = Date.now();
    return true;
  }

  // Check for SGR mouse protocol: ESC [ < num ; num ; num M or ESC [ < num ; num ; num m
  // Format: \x1b[<button;x;yM (press) or \x1b[<button;x;ym (release)
  // eslint-disable-next-line no-control-regex
  const sgrMatch = input.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
  if (sgrMatch) {
    const [, buttonStr, xStr, yStr, eventType] = sgrMatch;
    const buttonCode = parseInt(buttonStr!, 10);
    key.x = parseInt(xStr!, 10) - 1; // SGR reports 1-based coordinates
    key.y = parseInt(yStr!, 10) - 1;

    // Release is indicated by 'm' at the end
    key.release = eventType === 'm';

    // Button and modifier parsing for SGR
    key.button = buttonCode & 3; // Bottom 2 bits are the button number
    key.shift = !!((buttonCode >> 2) & 1);
    key.meta = !!((buttonCode >> 3) & 1);
    key.ctrl = !!((buttonCode >> 4) & 1);

    // Motion flag (bit 5)
    key.isMotion = !!((buttonCode >> 5) & 1);

    // Scroll wheel (bits 6-7)
    if ((buttonCode >> 6) & 1) {
      key.scroll = buttonCode & 1 ? 1 : -1;
    }

    // Hover detection
    key.isHover = key.isMotion && (key.button === 3 || buttonCode === 35);

    // Button number handling
    if (key.scroll !== 0 || key.release || key.isHover) {
      key.button = undefined;
    }

    stream.emit('mousepress', key);
    MostRecentMouseEventEmitedTime = Date.now();
    return true;
  }

  // Check for URXVT mouse protocol: ESC [ num ; num ; num M
  // eslint-disable-next-line no-control-regex
  const urxvtMatch = input.match(/^\x1b\[(\d+);(\d+);(\d+)M/);
  if (urxvtMatch) {
    const [, buttonStr, xStr, yStr] = urxvtMatch;
    const buttonCode = parseInt(buttonStr!, 10);
    key.x = parseInt(xStr!, 10) - 1; // URXVT also uses 1-based coordinates
    key.y = parseInt(yStr!, 10) - 1;

    // In URXVT, release is button code 3
    key.release = buttonCode === 3;

    // Modifier keys not directly supported in URXVT protocol
    // but can be determined from button code ranges
    key.button = buttonCode & 3;
    key.shift = buttonCode >= 4 && buttonCode <= 7;
    key.meta = buttonCode >= 8 && buttonCode <= 15;
    key.ctrl = buttonCode >= 16;

    // Motion detection in URXVT is less clear, often indicated by specific button ranges
    key.isMotion = buttonCode >= 32 && buttonCode <= 63;

    // No direct hover support in URXVT
    key.isHover = false;

    // Scroll wheel is typically codes 64-67
    if (buttonCode >= 64 && buttonCode <= 67) {
      key.scroll = buttonCode === 64 || buttonCode === 65 ? -1 : 1;
      key.button = undefined;
    }

    stream.emit('mousepress', key);
    MostRecentMouseEventEmitedTime = Date.now();
    return true;
  }

  return false;
}

/**
 * Debug function to log details about a mouse event
 *
 * @param event The mouse event to debug
 */
export function debugMouseEvent(event: MouseEvent): void {
  if (!event) return;

  const details = {
    x: event.x,
    y: event.y,
    button: event.button,
    release: event.release,
    isMotion: event.isMotion,
    isHover: event.isHover,
    scroll: event.scroll,
    modifiers: {
      ctrl: event.ctrl,
      meta: event.meta,
      shift: event.shift,
    },
  };

  Logger.debug('Mouse event:', details);

  // Human-readable description of event type
  let eventType = '';
  if (event.scroll !== 0) {
    eventType = `Scroll ${event.scroll > 0 ? 'up' : 'down'}`;
  } else if (event.isHover) {
    eventType = 'Hover motion';
  } else if (event.isMotion) {
    eventType = `Motion with button ${event.button} pressed`;
  } else if (event.release) {
    eventType = 'Button release';
  } else {
    eventType = `Button ${event.button} press`;
  }

  Logger.debug(`  Type: ${eventType}`);
  Logger.debug(`  Position: (${event.x}, ${event.y})`);
}

/**
 * Testing function to check if a particular mouse mode works in the current terminal
 *
 * @param output writable stream instance (e.g., process.stdout)
 * @param mode mouse mode to test
 * @returns Promise that resolves to true if the mode works, false otherwise
 */
export function testMouseMode(
  output: NodeJS.WritableStream,
  mode: MouseMode,
): Promise<boolean> {
  return new Promise(resolve => {
    const input = process.stdin as unknown as MouseAwareStream;
    // let detected = false;

    // Set a timeout to consider the test failed after 3 seconds
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 3000);

    // Set up a listener for mouse events
    const mouseHandler = () => {
      // detected = true;
      cleanup();
      resolve(true);
    };

    // Set up the mode
    enableMouseMode(output, mode);
    input.on('mousepress', mouseHandler);

    // Log instructions
    Logger.warn(`Testing mouse mode ${mode}...`);
    Logger.warn(
      'Please move your mouse or click anywhere in the terminal window.',
    );
    Logger.warn('Waiting 3 seconds for mouse event...');

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeout);
      input.removeListener('mousepress', mouseHandler);
      disableMouseMode(output, mode);
    };
  });
}

/**
 * Sets up mouse event handling on a stream with specified mouse tracking mode.
 *
 * @example
 * import { setupMouseEvents, MouseEvent, MouseAwareStream, MouseMode } from './mouse-events';
 *
 * const stdin = process.stdin as MouseAwareStream;
 * // Track all mouse movements including hover
 * const cleanup = setupMouseEventsWithMode(stdin, process.stdout, MouseMode.ANY);
 *
 * stdin.on('mousepress', (mouseEvent: MouseEvent) => {
 *   if (mouseEvent.isHover) {
 *     console.log('Mouse hovering at:', mouseEvent.x, mouseEvent.y);
 *   } else if (mouseEvent.isMotion) {
 *     console.log('Mouse moving with button pressed:', mouseEvent.button);
 *   } else if (mouseEvent.release) {
 *     console.log('Mouse button released');
 *   } else {
 *     console.log('Mouse button pressed:', mouseEvent.button);
 *   }
 * });
 *
 * @param input readable stream to receive mouse events
 * @param output writable stream to enable mouse events on
 * @param mode mouse tracking mode to enable
 * @returns a cleanup function that disables mouse events and removes listeners
 */
export function setupMouseEventsWithMode(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
  mode: MouseMode = MouseMode.BUTTON,
): () => void {
  // Enable specified mouse tracking mode
  enableMouseMode(output, mode);

  // Set up handler for data events on input
  const onData = (data: Buffer | string): void => {
    parseMouseEvents(input, data);
  };

  input.on('data', onData);

  // Return a cleanup function
  return function cleanup(): void {
    input.removeListener('data', onData);
    disableMouse(output);
  };
}

/**
 * Sets up enhanced mouse event handling with SGR encoding for extended coordinates
 *
 * @param input readable stream to receive mouse events
 * @param output writable stream to enable mouse events on
 * @param mode mouse tracking mode to enable
 * @returns a cleanup function that disables mouse events and removes listeners
 */
export function setupExtendedMouseEvents(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
  mode: MouseMode = MouseMode.ANY,
): () => void {
  // Enable SGR encoding for extended coordinates
  enableMouseEncoding(output, MouseEncoding.SGR);

  // Enable specified mouse tracking mode
  enableMouseMode(output, mode);

  // Set up handler for data events on input
  const onData = (data: Buffer | string): void => {
    parseMouseEvents(input, data);
  };

  input.on('data', onData);

  // Return a cleanup function
  return function cleanup(): void {
    input.removeListener('data', onData);
    disableMouseMode(output, mode);
    disableMouseEncoding(output, MouseEncoding.SGR);
  };
}

/**
 * Sets up mouse event handling on a stream.
 *
 * @param input readable stream to receive mouse events
 * @param output writable stream to enable mouse events on
 * @returns a cleanup function that disables mouse events and removes listeners
 */
export function setupMouseEvents(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
): () => void {
  return setupMouseEventsWithMode(input, output, MouseMode.BUTTON);
}

export function setupAnyMouseEvents(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
): () => void {
  return setupMouseEventsWithMode(input, output, MouseMode.ANY);
}

/**
 * Sets up the best available mouse support with proper extended encoding
 *
 * @param input readable stream to receive mouse events
 * @param output writable stream to enable mouse events on
 * @returns a cleanup function or undefined if mouse support isn't available
 */
export function setupBestMouseSupport(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
): (() => void) | undefined {
  const bestMode = detectBestSupportedMouseMode();

  if (bestMode === undefined) {
    return undefined;
  }

  return setupExtendedMouseEvents(input, output, bestMode);
}

// Example usage:
/*
import { setupMouseEvents, MouseEvent, MouseAwareStream } from './mouse-events';

// Cast process.stdin to MouseAwareStream to add mousepress event support
const stdin = process.stdin as MouseAwareStream;
const cleanup = setupMouseEvents(stdin, process.stdout);

stdin.on('mousepress', (mouseEvent: MouseEvent) => {
  console.log('Mouse event:', mouseEvent);
  // { name: 'mouse', x: 10, y: 20, button: 0, ctrl: false, meta: false, shift: false, ... }
});

// To clean up when done
// cleanup();
*/

//  ---------

export function isMouseEscapeSequence(input: string): boolean {
  return input.length >= 3 && input.substring(0, 3) === '\x1b[M';
}

// Add helper function to detect mouse motion events
export function isMouseMotion(event: MouseEvent): boolean {
  return event.isMotion === true;
}

// Add helper function to detect mouse hover events
export function isMouseHover(event: MouseEvent): boolean {
  return event.isHover === true;
}

// The commented out code remains unchanged
// function isMouseButton(input: string): boolean {
//   return input.length >= 3 && input.charCodeAt(3) >= 0o40 && input.charCodeAt(3) <= 0o43;
// }
// function isMouseCoordinates(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(4) >= 0o40 && input.charCodeAt(4) <= 0o60;
// }
// function isMouseScroll(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(5) >= 0o40 && input.charCodeAt(5) <= 0o60;
// }
// function isMouseRelease(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o43;
// }
// function isMousePress(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o42;
// }
// function isMouseMove(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o41;
// }
// function isMouseScrollUp(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o40;
// }
// function isMouseScrollDown(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o41;
// }
// function isMouseScrollLeft(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o42;
// }
// function isMouseScrollRight(input: string): boolean {
//   return input.length >= 6 && input.charCodeAt(3) === 0o43;
// }
// function isMouseScrollUpOrDown(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41);
// }
// function isMouseScrollLeftOrRight(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43);
// }
// function isMouseScrollUpOrDownOrLeftOrRight(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43);
// }
// function isMouseReleaseOrPress(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o42);
// }
// function isMouseMoveOrPress(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42);
// }
// function isMouseMoveOrRelease(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o43);
// }
// function isMouseMoveOrScroll(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40);
// }
// function isMouseMoveOrScrollUp(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40);
// }
// function isMouseMoveOrScrollDown(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o41);
// }
// function isMouseMoveOrScrollLeft(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42);
// }
// function isMouseMoveOrScrollRight(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o43);
// }
// function isMouseMoveOrScrollUpOrDown(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41);
// }
// function isMouseMoveOrScrollLeftOrRight(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43);
// }
// function isMouseMoveOrScrollUpOrDownOrLeftOrRight(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43);
// }
// function isMouseMoveOrScrollUpOrDownOrLeftOrRightOrRelease(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o43);
// }
// function isMouseMoveOrScrollUpOrDownOrLeftOrRightOrPress(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o42);
// }
// function isMouseMoveOrScrollUpOrDownOrLeftOrRightOrReleaseOrPress(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o42);
// }
// function isMouseMoveOrScrollUpOrDownOrLeftOrRightOrReleaseOrPressOrButton(input: string): boolean {
//   return input.length >= 6 && (input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o40 || input.charCodeAt(3) === 0o41 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o43 || input.charCodeAt(3) === 0o42 || input.charCodeAt(3) === 0o42);
// }

// NEEDS REVISION

/**
 * Common terminal types that are known to support mouse events
 */
export const MOUSE_SUPPORTING_TERMS = [
  'xterm',
  'xterm-256color',
  'screen',
  'screen-256color',
  'tmux',
  'tmux-256color',
  'rxvt-unicode',
  'rxvt-unicode-256color',
  'linux',
  'vt100',
  'konsole',
  'iTerm.app',
  'iTerm2.app',
];

/**
 * Check if the current terminal type is likely to support mouse events
 * based on the TERM environment variable
 *
 * @returns boolean indicating if the terminal likely supports mouse events
 */
export function isMouseSupported(): boolean {
  if (typeof process === 'undefined' || !process.env) {
    return false;
  }

  const termEnv = process.env['TERM'];
  if (!termEnv) {
    return false;
  }

  return MOUSE_SUPPORTING_TERMS.some(term =>
    termEnv.toLowerCase().includes(term.toLowerCase()),
  );
}

/**
 * Check if the terminal supports basic mouse button events
 *
 * @returns boolean indicating if basic mouse events are likely supported
 */
export function isButtonModeSupported(): boolean {
  return isMouseSupported();
}

/**
 * Check if the terminal supports mouse motion events
 *
 * @returns boolean indicating if mouse motion events are likely supported
 */
export function isMotionModeSupported(): boolean {
  // Most terminals that support mouse events also support motion tracking
  // Some older terminals might not
  if (typeof process === 'undefined' || !process.env) {
    return false;
  }

  const termEnv = process.env['TERM'];
  if (!termEnv) {
    return false;
  }

  // Exclude known terminals with limited mouse support
  const limitedMouseSupport = ['linux', 'vt100'];
  if (limitedMouseSupport.some(term => termEnv.toLowerCase() === term)) {
    return false;
  }

  return isMouseSupported();
}

/**
 * Check if the terminal supports any mouse mode (hover tracking)
 *
 * @returns boolean indicating if any mouse mode is likely supported
 */
export function isAnyModeSupported(): boolean {
  // Any mouse mode is the most advanced and not supported by all terminals
  if (typeof process === 'undefined' || !process.env) {
    return false;
  }

  const termEnv = process.env['TERM'];
  if (!termEnv) {
    return false;
  }

  // Only modern terminal emulators support ANY mode
  const anyModeSupportingTerms = [
    'xterm',
    'xterm-256color',
    'screen',
    'screen-256color',
    'tmux',
    'tmux-256color',
    'iTerm.app',
    'iTerm2.app',
  ];

  return anyModeSupportingTerms.some(term =>
    termEnv.toLowerCase().includes(term.toLowerCase()),
  );
}

/**
 * Try to detect the best supported mouse mode for the current terminal
 *
 * @returns the highest supported MouseMode or undefined if mouse events aren't supported
 */
export function detectBestSupportedMouseMode(): MouseMode | undefined {
  if (isAnyModeSupported()) {
    return MouseMode.ANY;
  }

  if (isMotionModeSupported()) {
    return MouseMode.MOTION;
  }

  if (isButtonModeSupported()) {
    return MouseMode.BUTTON;
  }

  return undefined;
}

/**
 * Setup the best available mouse mode for the terminal automatically
 *
 * @param input readable stream to receive mouse events
 * @param output writable stream to enable mouse events on
 * @returns a cleanup function that disables mouse events and removes listeners, or undefined if no mouse mode is supported
 */
export function setupBestAvailableMouseMode(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
): (() => void) | undefined {
  const bestMode = detectBestSupportedMouseMode();

  if (bestMode === undefined) {
    return undefined;
  }

  return setupMouseEventsWithMode(input, output, bestMode);
}

/**
 * Interface for terminal capability detection results
 */
export interface TerminalCapabilities {
  mouseSupported: boolean;
  buttonModeSupported: boolean;
  motionModeSupported: boolean;
  anyModeSupported: boolean;
  sgrEncoding: boolean;
  urxvtEncoding: boolean;
  utf8Encoding: boolean;
}

/**
 * Terminal detection response timeout in milliseconds
 * Increased from 1000ms to 2000ms to give terminals more time to respond
 */
const TERMINAL_DETECTION_TIMEOUT = 2000;

/**
 * Send a Device Attributes Request to the terminal and wait for response
 * with improved debugging and fallback support
 */
export function DELETE_ME_sendTerminalRequest(
  output: NodeJS.WritableStream,
  input: NodeJS.ReadableStream,
  request: string,
  expectedPattern: RegExp,
): Promise<RegExpExecArray | null> {
  return new Promise(resolve => {
    let responseBuffer = '';
    let receivedAnyData = false;

    // Handler to collect data from the terminal
    const dataHandler = (data: Buffer | string) => {
      receivedAnyData = true;
      const str = typeof data === 'string' ? data : data.toString('utf8');
      responseBuffer += str;

      Logger.debug(`Received terminal response: ${JSON.stringify(str)}`);

      // Check if we have a match
      const match = expectedPattern.exec(responseBuffer);
      if (match) {
        Logger.debug(`Found match: ${JSON.stringify(match)}`);
        cleanup();
        resolve(match);
      }
    };

    // Set up timeout handler
    const timeout = setTimeout(() => {
      if (responseBuffer) {
        Logger.debug(
          `Timeout with partial response: ${JSON.stringify(responseBuffer)}`,
        );
      } else if (receivedAnyData) {
        Logger.debug('Timeout with data received but no match found');
      } else {
        Logger.debug('Timeout with no data received');
      }
      cleanup();
      resolve(null); // Timeout - no match found
    }, TERMINAL_DETECTION_TIMEOUT);

    // Clean up function
    const cleanup = () => {
      clearTimeout(timeout);
      input.removeListener('data', dataHandler);
    };

    // Set up listener and send the request
    input.on('data', dataHandler);
    Logger.debug(`Sending terminal request: ${JSON.stringify(request)}`);
    output.write(request);
  });
}

/**
 * Fallback detection that attempts to enable a mouse mode and wait for user interaction
 * More reliable but requires user action
 */
export function testMouseModeWithFallback(
  output: NodeJS.WritableStream,
  input: MouseAwareStream,
  mode: MouseMode,
): Promise<boolean> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 100); // Very short timeout - just to set up the handler

    // Enable the mode immediately
    enableMouseMode(output, mode);

    // Set up a one-shot event handler
    const mouseHandler = () => {
      Logger.debug(`Mouse mode ${mode} is working!`);
      cleanup();
      resolve(true);
    };

    input.once('mousepress', mouseHandler);

    const cleanup = () => {
      clearTimeout(timeout);
      input.removeListener('mousepress', mouseHandler);
      disableMouseMode(output, mode);
    };
  });
}

/**
 * Detect mouse capabilities with both query and fallback methods
 */
export async function detectTerminalMouseCapabilities(
  output: NodeJS.WritableStream,
  input: NodeJS.ReadableStream,
): Promise<TerminalCapabilities> {
  const mouseInput = input as MouseAwareStream;
  const capabilities: TerminalCapabilities = {
    mouseSupported: false,
    buttonModeSupported: false,
    motionModeSupported: false,
    anyModeSupported: false,
    sgrEncoding: false,
    urxvtEncoding: false,
    utf8Encoding: false,
  };

  Logger.debug('Starting terminal mouse capability detection');

  // First try to detect by environment
  if (isMouseSupported()) {
    Logger.debug('Mouse support detected via TERM environment variable');
    capabilities.mouseSupported = true;
    capabilities.buttonModeSupported = true;
    capabilities.motionModeSupported = isMotionModeSupported();
    capabilities.anyModeSupported = isAnyModeSupported();

    // Try direct testing for SGR encoding
    try {
      // Set up silent parser just for detection
      const detectData = (data: Buffer | string) => {
        if (typeof data === 'string' && data.includes('\x1b[<')) {
          capabilities.sgrEncoding = true;
        } else if (Buffer.isBuffer(data)) {
          const str = data.toString('utf8');
          if (str.includes('\x1b[<')) {
            capabilities.sgrEncoding = true;
          }
        }
      };

      // Try to enable SGR encoding briefly
      mouseInput.on('data', detectData);
      enableMouseEncoding(output, MouseEncoding.SGR);

      // Wait a bit then disable
      await new Promise(resolve => setTimeout(resolve, 100));

      mouseInput.removeListener('data', detectData);
      disableMouseEncoding(output, MouseEncoding.SGR);
    } catch (err) {
      Logger.debug('Error during SGR encoding detection:', err);
    }

    // For URXVT and UTF8, trust the TERM variable
    capabilities.urxvtEncoding =
      capabilities.mouseSupported &&
      (process.env['TERM']?.includes('rxvt') ?? false);
    capabilities.utf8Encoding = capabilities.mouseSupported;

    return capabilities;
  }

  // Try manual tests if environment check failed
  try {
    Logger.debug('Testing mouse button mode');
    capabilities.buttonModeSupported = await testMouseModeWithFallback(
      output,
      mouseInput,
      MouseMode.BUTTON,
    );
    capabilities.mouseSupported = capabilities.buttonModeSupported;

    if (capabilities.mouseSupported) {
      Logger.debug('Testing mouse motion mode');
      capabilities.motionModeSupported = await testMouseModeWithFallback(
        output,
        mouseInput,
        MouseMode.MOTION,
      );

      Logger.debug('Testing mouse any mode');
      capabilities.anyModeSupported = await testMouseModeWithFallback(
        output,
        mouseInput,
        MouseMode.ANY,
      );

      // For encodings, assume modern terminals support SGR
      capabilities.sgrEncoding = true;
      capabilities.utf8Encoding = true;

      // Only some terminals support URXVT
      capabilities.urxvtEncoding =
        process.env['TERM']?.includes('rxvt') || false;
    }
  } catch (err) {
    Logger.debug('Error during mouse capability detection:', err);
  }

  // Reliable fallback for modern terminals
  if (
    !capabilities.mouseSupported &&
    (process.env['TERM']?.includes('xterm') ||
      process.env['TERM']?.includes('screen') ||
      process.env['TERM']?.includes('tmux'))
  ) {
    Logger.debug('Falling back to known terminal capabilities');
    capabilities.mouseSupported = true;
    capabilities.buttonModeSupported = true;
    capabilities.motionModeSupported = true;
    capabilities.anyModeSupported = true;
    capabilities.sgrEncoding = true;
    capabilities.utf8Encoding = true;
  }

  Logger.debug('Detected capabilities:', capabilities);
  return capabilities;
}

/**
 * Setup optimal mouse support with improved reliability
 */
export async function setupOptimalMouseSupport(
  input: MouseAwareStream,
  output: NodeJS.WritableStream,
): Promise<(() => void) | undefined> {
  Logger.debug('Setting up optimal mouse support');

  // Actually detect terminal capabilities
  const capabilities = await detectTerminalMouseCapabilities(output, input);

  // Check if mouse is supported at all
  if (!capabilities.mouseSupported) {
    Logger.debug('Mouse support not detected in this terminal');
    return undefined;
  }

  // Determine best mode based on detected capabilities
  let mode: MouseMode | undefined;
  if (capabilities.anyModeSupported) {
    mode = MouseMode.ANY;
    Logger.debug('Using ANY mouse mode (hover support)');
  } else if (capabilities.motionModeSupported) {
    mode = MouseMode.MOTION;
    Logger.debug('Using MOTION mouse mode (drag support)');
  } else if (capabilities.buttonModeSupported) {
    mode = MouseMode.BUTTON;
    Logger.debug('Using BUTTON mouse mode (click support only)');
  } else {
    Logger.debug('No supported mouse mode detected');
    return undefined;
  }

  // Use the best available encoding
  if (capabilities.sgrEncoding) {
    Logger.debug('Enabling SGR mouse encoding (extended coordinates)');
    enableMouseEncoding(output, MouseEncoding.SGR);
  } else if (capabilities.urxvtEncoding) {
    Logger.debug('Enabling URXVT mouse encoding');
    enableMouseEncoding(output, MouseEncoding.URXVT);
  } else if (capabilities.utf8Encoding) {
    Logger.debug('Enabling UTF8 mouse encoding');
    enableMouseEncoding(output, MouseEncoding.UTF8);
  }

  // Enable the chosen mode
  Logger.debug(`Enabling mouse mode: ${mode}`);
  enableMouseMode(output, mode);

  // Set up handler for mouse events
  const onData = (data: Buffer | string): void => {
    parseMouseEvents(input, data);
  };

  input.on('data', onData);

  // Return cleanup function that disables all enabled features
  return function cleanup(): void {
    input.removeListener('data', onData);
    disableMouseMode(output, mode!);

    if (capabilities.sgrEncoding) {
      disableMouseEncoding(output, MouseEncoding.SGR);
    }
    if (capabilities.urxvtEncoding) {
      disableMouseEncoding(output, MouseEncoding.URXVT);
    }
    if (capabilities.utf8Encoding) {
      disableMouseEncoding(output, MouseEncoding.UTF8);
    }
  };
}
