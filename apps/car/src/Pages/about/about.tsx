import React from 'react';
import Table from './table.js';
import { View } from '../../../../shared/index.js';
import { use$ } from '@legendapp/state/react';
import { Newline, Text } from 'ink';
import { FLEX1 } from '../../constants.js';
import { observable } from '@legendapp/state';
import { detectTerminalMouseCapabilities } from '../../../../shared/src/utils/mouse-events.js';

// const log = Logger.extend('About');

const termialCapabilities$ = observable(async () => {
  const res = await detectTerminalMouseCapabilities(
    process.stdout,
    process.stdin,
  );
  return res;
});

export function About() {
  const termialCapabilities = use$(termialCapabilities$);

  if (termialCapabilities === undefined) {
    return <Text>Never</Text>;
  }

  const TC = (() => {
    const tc = termialCapabilities;
    type RemoveSupported<T extends string> = T extends `${infer Base}Supported`
      ? Base
      : T;
    type KeysWithoutSupported = {
      [K in keyof typeof tc as RemoveSupported<string & K>]: string;
    };

    return {
      anyMode: tc.anyModeSupported + '',
      buttonMode: tc.buttonModeSupported + '',
      motionMode: tc.motionModeSupported + '',
      mouse: tc.mouseSupported + '',
      sgrEncoding: tc.sgrEncoding + '',
      urxvtEncoding: tc.urxvtEncoding + '',
      utf8Encoding: tc.utf8Encoding + '',
    } satisfies KeysWithoutSupported;
  })();

  return (
    <View style={{ ...FLEX1, borderStyle: 'round' }}>
      <Text>Terminal: {process.env['TERM']}</Text>
      <Newline />
      <Text>Mouse Capabilities</Text>
      <View style={{ paddingLeft: 1, paddingRight: 1 }}>
        <Table data={[TC]} />
      </View>
      {}
    </View>
  );
}
