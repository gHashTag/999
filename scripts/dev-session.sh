#!/bin/bash
# Создает и настраивает сессию tmux для разработки

SESSION_NAME="agentdev"

# Проверяем, существует ли сессия
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? != 0 ]; then
  echo "🚀 Creating new tmux session: ${SESSION_NAME}"
  # Создаем новую сессию и первое окно (Main)
  # Запускаем компилятор в первом окне
  tmux new-session -d -s $SESSION_NAME -n Main 'bun run build:watch'

  # Создаем второе окно (Servers)
  tmux new-window -t $SESSION_NAME:1 -n Servers
  # Разделяем второе окно на две панели
  tmux split-window -h -t $SESSION_NAME:1

  # Запускаем Inngest Dev Server в левой панели второго окна
  tmux send-keys -t $SESSION_NAME:1.0 'bun run dev:serve' C-m

  # Возвращаемся в первое окно (Main) и разделяем его
  tmux select-window -t $SESSION_NAME:0
  tmux split-window -v -t $SESSION_NAME:0

  # Запускаем основной сервер в нижней панели первого окна
  tmux send-keys -t $SESSION_NAME:0.1 'bun run dev:start' C-m

  # Переключаемся обратно на верхнюю панель первого окна для работы
  tmux select-pane -t $SESSION_NAME:0.0
else
  echo "✅ Attaching to existing tmux session: ${SESSION_NAME}"
fi

# Подключаемся к сессии
tmux attach-session -t $SESSION_NAME 