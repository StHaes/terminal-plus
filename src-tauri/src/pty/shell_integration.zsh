# Terminal Plus — zsh shell integration
# Sources the user's .zshrc first, then applies our enhancements.

# Source user's original .zshrc
[[ -f "${ZDOTDIR:-$HOME}/.zshrc" ]] && source "${ZDOTDIR:-$HOME}/.zshrc"

# === Terminal Plus enhancements ===

# ── Colors for ls, grep, etc. ──
export CLICOLOR=1
export CLICOLOR_FORCE=1
# macOS BSD ls colors: bold cyan dirs, bold magenta links, bold green sockets,
# bold yellow pipes, bold red executables
export LSCOLORS=GxFxCxDxBxegedabagaced
# GNU ls / eza colors
export LS_COLORS='di=1;36:ln=1;35:so=1;32:pi=1;33:ex=1;31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=34;43'

# ── Prompt with git branch ──
autoload -Uz vcs_info
_terminal_plus_precmd_vcs() { vcs_info }
precmd_functions+=( _terminal_plus_precmd_vcs )
setopt prompt_subst
zstyle ':vcs_info:git:*' formats ' %F{#B040D4}(%b)%f'
zstyle ':vcs_info:*' enable git

# Two-line prompt (Midnight Indigo palette):
#   Line 1: mint user · blue path · magenta (branch)
#   Line 2: blue ❯ cursor
PROMPT=$'\n''%F{#C8F5DC}%n%f %F{#8B7DFF}%~%f${vcs_info_msg_0_}'$'\n''%F{#3318E8}❯%f '
RPROMPT='%F{#3A3560}%T%f'

# ── ls: append / to directories for Terminal+ link detection ──
# Use a function (overrides any alias) that injects -p to mark directories with /
ls() { command ls -p "$@" }

# ── Syntax highlighting (if installed) ──
# This colors commands, arguments, paths, strings differently as you type.
for _tp_hl in \
  /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh \
  /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh \
  /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh \
  "${HOME}/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" \
  "${HOME}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"; do
  if [[ -f "$_tp_hl" ]]; then
    source "$_tp_hl"
    # Custom highlight colors matching Midnight Indigo palette
    ZSH_HIGHLIGHT_STYLES[command]='fg=#7EECF0,bold'
    ZSH_HIGHLIGHT_STYLES[builtin]='fg=#7EECF0,bold'
    ZSH_HIGHLIGHT_STYLES[alias]='fg=#7EECF0,bold'
    ZSH_HIGHLIGHT_STYLES[function]='fg=#7EECF0,bold'
    ZSH_HIGHLIGHT_STYLES[precommand]='fg=#7EECF0,bold,underline'
    ZSH_HIGHLIGHT_STYLES[path]='fg=#8B7DFF,underline'
    ZSH_HIGHLIGHT_STYLES[path_prefix]='fg=#8B7DFF'
    ZSH_HIGHLIGHT_STYLES[globbing]='fg=#FFD580'
    ZSH_HIGHLIGHT_STYLES[single-quoted-argument]='fg=#C8F5DC'
    ZSH_HIGHLIGHT_STYLES[double-quoted-argument]='fg=#C8F5DC'
    ZSH_HIGHLIGHT_STYLES[dollar-quoted-argument]='fg=#C8F5DC'
    ZSH_HIGHLIGHT_STYLES[redirection]='fg=#FFD580,bold'
    ZSH_HIGHLIGHT_STYLES[arg0]='fg=#7EECF0,bold'
    ZSH_HIGHLIGHT_STYLES[default]='fg=#D5F5E3'
    ZSH_HIGHLIGHT_STYLES[unknown-token]='fg=#FF6B8A,bold'
    ZSH_HIGHLIGHT_STYLES[reserved-word]='fg=#B040D4,bold'
    ZSH_HIGHLIGHT_STYLES[suffix-alias]='fg=#7EECF0,underline'
    ZSH_HIGHLIGHT_STYLES[single-hyphen-option]='fg=#FFD580'
    ZSH_HIGHLIGHT_STYLES[double-hyphen-option]='fg=#FFD580'
    ZSH_HIGHLIGHT_STYLES[comment]='fg=#3A3560'
    break
  fi
done
unset _tp_hl

# ── Autosuggestions (if installed) ──
for _tp_as in \
  /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh \
  /usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh \
  /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh \
  "${HOME}/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh" \
  "${HOME}/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh"; do
  if [[ -f "$_tp_as" ]]; then
    source "$_tp_as"
    ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=#3A3560'
    break
  fi
done
unset _tp_as
