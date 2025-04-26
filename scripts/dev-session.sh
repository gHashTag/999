#!/bin/bash

SESSION_NAME="999"

# Проверяем, существует ли уже сессия
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? != 0 ]; then
  echo "Creating new tmux session with panes: $SESSION_NAME"

  # Создаем новую сессию и запускаем первый процесс (build:watch) в первой панели
  tmux new-session -d -s $SESSION_NAME -n Main 'pnpm run build:watch'

  # Разделяем окно горизонтально и запускаем второй процесс (dev:serve) в новой панели
  tmux split-window -t $SESSION_NAME:0 -h
  tmux send-keys -t $SESSION_NAME:0.1 'pnpm run dev:serve' C-m

  # Выбираем верхнюю панель (0.0) и разделяем ее вертикально
  tmux select-pane -t $SESSION_NAME:0.0
  tmux split-window -t $SESSION_NAME:0 -v
  tmux send-keys -t $SESSION_NAME:0.0 'pnpm run dev:start' C-m

  # Выбираем основную панель (теперь это build:watch в 0.1)
  tmux select-pane -t $SESSION_NAME:0.1

  echo "Session $SESSION_NAME created with panes for build:watch, dev:serve, dev:start."
  echo "Attach to it using: tmux attach -t $SESSION_NAME"
else
  echo "Session $SESSION_NAME already exists."
  echo "Attach to it using: tmux attach -t $SESSION_NAME"
fi

# НЕ ПЫТАЕМСЯ автоматически присоединиться 