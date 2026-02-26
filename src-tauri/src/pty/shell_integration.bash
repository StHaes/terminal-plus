# Terminal Plus — bash shell integration
# Sources the user's config first, then applies our enhancements.

# Source user's original configs
[[ -f "$HOME/.bash_profile" ]] && source "$HOME/.bash_profile"
[[ -f "$HOME/.bashrc" ]] && source "$HOME/.bashrc"

# === Terminal Plus enhancements ===

# ── Colors for ls, grep, etc. ──
export CLICOLOR=1
export CLICOLOR_FORCE=1
export LSCOLORS=GxFxCxDxBxegedabagaced
export LS_COLORS='di=1;36:ln=1;35:so=1;32:pi=1;33:ex=1;31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=34;43'

# Enable color in grep
alias grep='grep --color=auto'

# ── Git branch for prompt ──
_tp_git_branch() {
  local branch
  branch=$(git symbolic-ref --short HEAD 2>/dev/null) || return
  printf ' \033[38;2;176;64;212m(%s)\033[0m' "$branch"
}

# ── ls: append / to directories for Terminal+ link detection ──
# Use a function (overrides any alias) that injects -p to mark directories with /
ls() { command ls -p "$@"; }

# ── Two-line prompt (Midnight Indigo palette) ──
# Mint user · purple path · magenta (branch)
# Blue ❯ cursor
PS1='\n\[\033[38;2;200;245;220m\]\u\[\033[0m\] \[\033[38;2;139;125;255m\]\w\[\033[0m\]$(_tp_git_branch)\n\[\033[38;2;51;24;232m\]❯\[\033[0m\] '
