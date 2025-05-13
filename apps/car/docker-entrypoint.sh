#!/bin/sh
# Entry point script for car application that handles terminal interaction properly

# Set proper terminal settings
stty -echo -icanon

# Echo commands to run for debugging
echo "Starting car application with interactive terminal..."

# Execute the Node.js application with environment variables for proper TTY handling
exec node dist/car/src/app.js
