export const LABELS = {
  // Header
  APP_TITLE: "Лабораторная работа №1",
  APP_SUBTITLE: "Отыскание кратчайшего пути в ориентированном графе между двумя заданными вершинами методом Дейкстры.",
  
  // Graph Visualization
  GRAPH_VISUALIZATION: "Graph Visualization",
  GRAPH_INSTRUCTIONS: "Двойное нажатие - добавление вершины",
  
  // Incidence Matrix
  ADD_NODE: "Добавить вершину",
  NO_NODES: "Нет вершин",
  NO_NODES_MESSAGE: "Двойное нажатие по полю графа создаст новую вершину, либо используйте кнопку снизу",
  
  // Path Finder
  SHORTEST_PATH: "Нахождение кратчайшего пути",
  START_NODE: "Начальная вершина",
  END_NODE: "Конечная вершина",
  SELECT_START: "Вершина...",
  SELECT_END: "Вершина...",
  FIND_PATH: "Найти путь",
  CLEAR: "Очистить",
  PATH_FOUND: "Путь найден",
  PATH: "Путь:",
  DISTANCE: "Расстояние:",
  NO_PATH: "Не найдено пути между выбранными вершинами",
  
  // Edge Controls
  EDGE_CONTROLS: "Управление вершинами",
  SELECTED: "Выбраны:",
  SELECT_TWO_NODES: "(выберите 2 вершины)",
  WEIGHT: "Вес",
  ADD_EDGE: "Добавить вершину",
  CHANGE_WEIGHT: "Изменить вес",
  DELETE_EDGE: "Удалить вершину",
  
  
  // Placeholders
  ENTER_WEIGHT: "Enter weight",
  PLACEHOLDER_ZERO: "0",
  
  // Import/Export
  IMPORT_GRAPH: "Импортировать граф",
  IMPORT_SUCCESS: "Граф импортирован успешно",
  IMPORT_ERROR: "Ошибка импорта графа. Проверьте формат файла.",
  EXPORT_GRAPH: "Экспортировать граф",
  EXPORT_SUCCESS: "Граф экспортирован успешно",
  
  // Algorithms
  ALGORITHM: "Алгоритм",
  DIJKSTRA: "Алгоритм Дейкстры",
  FLOYD: "Алгоритм Флойда-Уоршелла",
  ALL_PAIRS_PATHS: "Все пары кратчайших путей",
  
  // Tabs
  TAB_EDITOR: "Редактор",
  TAB_VISUALIZATION: "Визуализация",
  
  // Comparison
  ALGORITHM_COMPARISON: "Сравнение алгоритмов",
  RUN_COMPARISON: "Запустить сравнение",
  PAIRS_FOUND: "пар найдено",
  WINNER: "Победитель",
  FASTER: "быстрее",
  ALL_SHORTEST_PATHS: "Все кратчайшие пути",
  
  // Random Graph Generator
  RANDOM_GRAPH: "Генератор случайного графа",
  NUMBER_OF_NODES: "Количество вершин",
  GENERATE_GRAPH: "Сгенерировать граф",
  NODES_GENERATED: "вершин сгенерировано",
  EDGES_GENERATED: "дуг сгенерировано",
  
  // Comparison Controls
  COMPARISON_CONTROLS: "Управление сравнением",
  COMPARE_USER_GRAPH: "Сравнить с пользовательским графом",
  COMPARE_RANDOM_GRAPH: "Сравнить со случайным графом",
} as const;
