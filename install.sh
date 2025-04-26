#!/bin/bash

# Set variables
BIN_DIR="$HOME/bin"
WRAPPER_PATH="$BIN_DIR/svl"
WRAPPER_CONTENT='#!/bin/zsh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

nvm use 22.14.0 > /dev/null

node $REPO_DIR/serval/dist/bin/index.js "$@"
'

ZSHRC="$HOME/.zshrc"
EXPORT_LINE='export PATH="$HOME/bin:$PATH"'
SOURCE_AUTOCOMPLETE_LINE='source $REPO_DIR/serval/bin/bash-completion.sh'

# 1. Create $HOME/bin if it doesn't exist
mkdir -p "$BIN_DIR"

# 2. Create wrapper script if it doesn't exist
if [ ! -f "$WRAPPER_PATH" ]; then
  echo "$WRAPPER_CONTENT" > "$WRAPPER_PATH"
  echo "✅ Created svl wrapper at $WRAPPER_PATH"
else
  echo "⚠️ Wrapper already exists at $WRAPPER_PATH"
fi

# 3. Make the wrapper executable
chmod +x "$WRAPPER_PATH"

# 4. Add bin directory to PATH in .zshrc if not already there
if ! grep -Fxq "$EXPORT_LINE" "$ZSHRC"; then
  echo "# Serval CLI" >> "$ZSHRC"
  echo "$EXPORT_LINE" >> "$ZSHRC"
  echo "$SOURCE_AUTOCOMPLETE_LINE" >> "$ZSHRC"
  echo "✅ Added \$HOME/bin to PATH in $ZSHRC"
else
  echo "ℹ️ \$HOME/bin already in PATH"
fi

# 5. Source the updated .zshrc
echo "🔄 Reloading shell config..."
source "$ZSHRC"

echo "🎉 Setup complete! You can now use \`svl\` anywhere."
