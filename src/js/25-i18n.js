// =====================================================================
// Micrograph Figure Kit — 25. Interface language (EN / RU)
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Translates the page text in place; the English text is restored on switching back.
// =====================================================================
(function(){
const RU={
'Micrograph Figure Kit':'Micrograph Figure Kit',
'Check scale':'Проверьте масштаб',
'Keyboard shortcuts':'Сочетания клавиш','μm':'мкм','a b':'а б','⤢ Fit to figure size':'⤢ Вписать в размер рисунка','Fit to figure size':'Вписать в размер рисунка','Scale and move all panels together so they fill the figure width inside the outer margin':'Масштабировать и сдвинуть все панели вместе, чтобы они заполнили ширину рисунка внутри внешнего отступа','Ctrl + click panels in the preview to select several and align them.':'Ctrl + клик по панелям на превью, чтобы выбрать несколько и выровнять.','Ctrl + click panels to select several':'Ctrl + клик по панелям, чтобы выбрать несколько','EDS':'ЭДРС','⌫ Eraser':'⌫ Ластик','Undo stroke':'Отменить мазок','Clear erasing':'Очистить стирание','Brush eraser: paint over anything on the image. Alt+click picks the color from the image. Esc to stop.':'Кисть-ластик: закрашивайте что угодно на рисунке. Alt+клик берёт цвет с рисунка. Esc — выход.','Remove the last eraser stroke':'Удалить последний мазок ластика','Remove all eraser strokes on this image':'Удалить все мазки ластика на этом рисунке','Alt+click on the image to pick a color':'Alt+клик по рисунку, чтобы взять цвет','image':'рисунок','About':'О программе','Night mode':'Ночной режим','Day mode':'Дневной режим','Keyboard shortcuts (?)':'Сочетания клавиш (?)','Undo':'Отменить','Redo':'Повторить',
'Switch tab':'Переключить вкладку','Previous / next image':'Предыдущий / следующий рисунок','Process the selected image':'Обработать выбранный рисунок','Process new images':'Обработать новые рисунки',
'Crop tool on / off':'Инструмент обрезки вкл. / выкл.','Large view on / off':'Крупный просмотр вкл. / выкл.','Download the selected image':'Скачать выбранный рисунок','Download ZIP':'Скачать ZIP',
'Add text':'Добавить текст','Add rectangle':'Добавить прямоугольник','Add circle':'Добавить круг','Add arrow':'Добавить стрелку','Add line':'Добавить линию',
'Duplicate the selected object':'Дублировать выбранный объект','Copy / paste the selected object (also to another image)':'Копировать / вставить выбранный объект (в т. ч. на другой рисунок)',
'Move the selected object by 1 px (Shift: 10 px)':'Сдвинуть выбранный объект на 1 px (Shift: 10 px)','Delete the selected object':'Удалить выбранный объект','Deselect / close':'Снять выделение / закрыть','Show this list':'Показать этот список',
'Single-letter shortcuts do not work while the cursor is in a text field.':'Однобуквенные сочетания не работают, пока курсор в текстовом поле.','Object copied.':'Объект скопирован.',
'Save session':'Сохранить сессию','Save all images, crops, edits, annotations, figure layout and settings to a .json file (Ctrl+S)':'Сохранить все рисунки, обрезки, правки, аннотации, макет рисунка и настройки в файл .json (Ctrl+S)','Open a saved .json session and continue where you left off (Ctrl+O)':'Открыть сохранённую сессию .json и продолжить с того же места (Ctrl+O)',
'Measurements':'Измерения','Measurement style on the image':'Стиль измерений на рисунке','for':'для','default for this image; select a row to style one measurement':'по умолчанию для рисунка; выберите строку, чтобы задать стиль одного измерения','Use the image default':'Как по умолчанию','Use for all measurements on this image':'Для всех измерений на рисунке','Same as the scale label':'Как у подписи масштаба','Line width, px (0 = auto)':'Толщина линии, px (0 = авто)','Size, pt (0 = auto)':'Размер, pt (0 = авто)','Apply style to all images':'Применить стиль ко всем рисункам','Measurement style applied to all images.':'Стиль измерений применён ко всем рисункам.','↔ Distance':'↔ Расстояние','∠ Angle':'∠ Угол','◯ Particle (ellipse)':'◯ Частица (эллипс)','⬠ Polygon':'⬠ Многоугольник',
'Distance':'Расстояние','Angle':'Угол','Particle':'Частица','Polygon':'Многоугольник','Type':'Тип','Value':'Значение','Details':'Подробности','Image':'Рисунок','mean':'среднее',
'Show on image (included in export)':'Показывать на рисунке (попадает в экспорт)','This image':'Этот рисунок','Copy table':'Копировать таблицу','Export CSV':'Экспорт CSV','Clear':'Очистить',
'Drag from one end to the other, or click two points.':'Протяните от одного конца к другому или щёлкните две точки.',
'Click three points: first arm, vertex, second arm.':'Щёлкните три точки: первая сторона, вершина, вторая сторона.',
'Drag a box around the particle.':'Обведите частицу рамкой.',
'Click points along the outline. Double-click, press Enter or click the first point to close.':'Щёлкайте точки по контуру. Двойной щелчок, Enter или щелчок по первой точке замыкает контур.',
'Esc stops the tool.':'Esc — выключить инструмент.','Pick a tool, then draw on the Result preview.':'Выберите инструмент и рисуйте на превью результата.','Process the image first to measure on it.':'Сначала обработайте рисунок, затем измеряйте.',
'Images without a calibration are measured in pixels.':'Рисунки без калибровки измеряются в пикселях.','Delete all measurements on this image?':'Удалить все измерения на этом рисунке?',
'Table copied. Paste it into Excel.':'Таблица скопирована. Вставьте её в Excel.','Copy is not allowed here; use Export CSV instead.':'Копирование недоступно; используйте экспорт CSV.','Measurements saved.':'Измерения сохранены.',
'Measure distance (Esc to stop)':'Измерить расстояние (Esc — стоп)',
'Values use the calibration of each image (µm per pixel from the original scale bar). Click a row to select a measurement, then drag its points or its label on the Result to adjust it. Ellipse and polygon give the area and the equivalent circle diameter. Area draws any outline freehand and shows its area.':'Значения используют калибровку каждого рисунка (мкм на пиксель по исходной шкале). Щёлкните строку, чтобы выбрать измерение, затем перетаскивайте его точки или подпись на результате. Эллипс и многоугольник дают площадь и эквивалентный диаметр круга.',
'⧉ Inset':'⧉ Врезка','Inset':'Врезка','Inset area':'Область врезки','Connector lines':'Соединительные линии','Add inset (magnified region)':'Добавить врезку (увеличенный фрагмент)',
'Magnified view of a region. Move or resize the dashed area to choose what is enlarged.':'Увеличенный фрагмент. Перемещайте и меняйте размер пунктирной области, чтобы выбрать, что увеличить.',
'Letter position':'Положение буквы','Inside the image (upper-left corner)':'Внутри рисунка (левый верхний угол)','Outside, above – left':'Снаружи, сверху – слева','Outside, above – center':'Снаружи, сверху – по центру','Outside, above – right':'Снаружи, сверху – справа','Outside, right of the image':'Снаружи, справа от рисунка','Outside, left of the image':'Снаружи, слева от рисунка',
'Batch apply from this image':'Пакетное применение с этого рисунка','Apply to':'Применить к',
'Images of the same size':'Рисункам того же размера','Images with the same aspect ratio':'Рисункам с тем же соотношением сторон','All other images':'Всем остальным рисункам',
'Crop area':'Область обрезки','Brightness, contrast, sharpness':'Яркость, контраст, резкость',
'Other images that will change:':'Будут изменены другие рисунки:','No other images match.':'Нет подходящих рисунков.','Choose what to apply.':'Выберите, что применить.',
'Copies the crop and picture adjustments of the selected image. For different sizes the crop is scaled proportionally.':'Копирует обрезку и коррекцию выбранного рисунка. Для других размеров обрезка масштабируется пропорционально.','Undo (Ctrl+Z)':'Отменить (Ctrl+Z)','Redo (Ctrl+Y)':'Повторить (Ctrl+Y)','Nothing to undo.':'Нечего отменять.','Nothing to redo.':'Нечего повторять.','Open session':'Открыть сессию',
'Nothing to save yet.':'Пока нечего сохранять.','Session saved.':'Сессия сохранена.',
'This file is not a session file.':'Этот файл не является файлом сессии.',
'Opening a session replaces the current images, edits and settings. Continue?':'Открытие сессии заменит текущие рисунки, правки и настройки. Продолжить?',
'Hide for this image':'Скрыть для этого рисунка',
'Warn about uncertain OCR readings (yellow badge)':'Предупреждать о неуверенном распознавании OCR (жёлтая метка)',
'OCR is not sure about the scale label. Click to check the source scale in Calibration.':'OCR не уверен в подписи масштаба. Нажмите, чтобы проверить исходный масштаб в калибровке.',
'OCR is not sure about this element name. Check the label.':'OCR не уверен в названии элемента. Проверьте подпись.',
'OCR is not sure about the scale value. Check it.':'OCR не уверен в значении масштаба. Проверьте его.',
'Software for preparing publication figures':'Программа подготовки рисунков для публикаций',
'1 · Clean & annotate':'1 · Очистка и аннотации','2 · Compose figure':'2 · Сборка рисунка','3 · EDS maps':'3 · ЭДРС-карты','● Local':'● Локально',
'Theme':'Тема','saved in this browser':'хранится в этом браузере','Saved themes':'Сохранённые темы','Default settings':'Настройки по умолчанию','Name for a new theme':'Название новой темы',
'Apply':'Применить','Save current':'Сохранить текущие','Delete':'Удалить','Export':'Экспорт','Import':'Импорт','default':'по умолчанию',
'Apply the last used theme when the tool opens':'Применять последнюю тему при открытии программы',
'A theme stores scale label, unit language, decimal separator, font family, style and size, print width, panel letter text, style, size, margin and highlight, advanced bar settings, the Compose figure settings and the interface language. Save with an existing name to update it. Export a theme as a .json file to use it on another computer.':'Тема хранит настройки масштабной подписи, язык единиц, десятичный разделитель, шрифт (вид, начертание, размер), ширину при печати, текст, начертание, размер, отступ и подложку буквы панели, дополнительные настройки шкалы, настройки сборки рисунка и язык интерфейса. Сохраните под существующим именем, чтобы обновить тему. Экспортируйте тему в файл .json, чтобы использовать её на другом компьютере.',
'1. Input images':'1. Исходные рисунки','Drag and drop image files or choose them manually.':'Перетащите файлы рисунков или выберите их вручную.','Clear':'Очистить','Drop files here':'Перетащите файлы сюда','or click to browse':'или нажмите, чтобы выбрать',
'Brightness, contrast, sharpness':'Яркость, контраст, резкость','no image selected':'рисунок не выбран','Brightness, %':'Яркость, %','Contrast, %':'Контраст, %','Sharpness, % (− soften, + sharpen)':'Резкость, % (− смягчить, + повысить)','Apply to all images':'Применить ко всем','Reset':'Сбросить',
'Changes the selected image only; the original file is not modified. The adjusted image is used in the Result, saved files and Compose figure. Scale bar, letters and text are drawn on top and are not affected.':'Меняется только выбранный рисунок, исходный файл не изменяется. Исправленный рисунок используется в результате, сохраняемых файлах и сборке рисунка. Масштабная шкала, буквы и текст рисуются поверх и не меняются.',
'Original/source scale value':'Исходное значение масштаба',
'<b>Auto read</b> — local OCR reads the original scale text next to the bar in the image footer (dark, gray or light footers; solid, ruler-type or segmented bars)':'<b>Автоматически</b> — локальное распознавание читает исходную подпись масштаба рядом со шкалой на плашке рисунка (тёмные, серые и светлые плашки; сплошные, линеечные и сегментные шкалы)',
'<b>Manual source value</b> — use one original scale value for all files':'<b>Вручную</b> — одно исходное значение масштаба для всех файлов',
'This value is the calibration source. The output bar length is computed from it. Example: if the original image is 1 µm and you set the output to 2 µm, the final bar becomes 2× longer automatically. Units: nm, µm, mm, m, Å. A wrong auto read can be corrected per file in <b>Calibration</b> on the right.':'Это значение — основа калибровки, по нему вычисляется длина итоговой шкалы. Пример: если на исходном рисунке 1 мкм, а на выходе задано 2 мкм, шкала автоматически станет в 2 раза длиннее. Единицы: нм, мкм, мм, м, Å. Неверно прочитанное значение можно исправить для каждого файла в блоке <b>Калибровка</b> справа.',
'Scale label':'Масштабная подпись','Unit language':'Язык единиц','English — µm, nm':'Английский — µm, nm','Decimal separator':'Десятичный разделитель','Auto (comma for Russian)':'Авто (запятая для русского)','Point — 0.5':'Точка — 0.5','Comma — 0,5':'Запятая — 0,5',
'Layout':'Расположение','Unit on top, bar below':'Подпись сверху, шкала снизу','Bar on top, unit below':'Шкала сверху, подпись снизу','Position':'Положение','Bottom right':'Справа внизу','Bottom left':'Слева внизу','Top right':'Справа вверху','Top left':'Слева вверху',
'Color of bar and text':'Цвет шкалы и текста','White':'Белый','Black':'Чёрный','Highlight color':'Цвет подложки','Margin, % of width':'Отступ, % ширины',
'Add a background highlight behind the bar and unit for better contrast':'Добавить подложку под шкалу и подпись для контраста',
'You can also drag the scale bar or the panel letter on the Result preview to place it anywhere on one image.':'Масштабную шкалу и букву панели можно перетащить на превью результата в любое место отдельного рисунка.',
'Font':'Шрифт','Font family':'Шрифт','Imported font':'Импортированный шрифт','Style':'Начертание','Bold':'Жирный','Regular':'Обычный','Bold italic':'Жирный курсив','Italic':'Курсив',
'Unit text size':'Размер подписи','Fixed size (pt, as in Word)':'Фиксированный (pt, как в Word)','Auto from image size':'Авто по размеру рисунка','Auto from bar length':'Авто по длине шкалы','Auto size, % of short side':'Авторазмер, % короткой стороны','Size, pt':'Размер, pt','Figure width in print, cm':'Ширина рисунка в печати, см',
'Import font':'Импорт шрифта','Remove imported font':'Удалить импортированный шрифт',
'Point sizes match Word when the figure is printed at this width (8.5 cm ≈ one journal column, 17 cm ≈ full page width).':'Размеры в pt совпадают с Word, если рисунок напечатан такой ширины (8,5 см ≈ одна колонка журнала, 17 см ≈ полная ширина страницы).',
'The font applies to the unit, the panel letter and free text. An imported font file is stored only in your browser. System fonts are used if installed on this computer.':'Шрифт применяется к подписи масштаба, букве панели и свободному тексту. Импортированный шрифт хранится только в вашем браузере. Системные шрифты используются, если установлены на компьютере.',
'Panel letter':'Буква панели','upper-left corner':'левый верхний угол','Add a letter (a, b, c…) to the upper-left corner of each image, in file order':'Добавить букву (а, б, в…) в левый верхний угол каждого рисунка по порядку файлов','Text':'Текст','Size, pt (0 = auto)':'Размер, pt (0 = авто)','Add a background highlight behind the letter':'Добавить подложку под букву',
'Write any text. A single letter such as <b>a</b>, <b>(a)</b>, <b>C)</b>, <b>а</b> or <b>(А)</b> continues automatically on the next images (b, c… or б, в… following GOST, without ё з й о ч ъ ы ь); any other text is used as written on every image. Override the letter of one image in <b>Scale label and panel letter on this image</b>; add free text with <b>+ Text</b> in <b>Text, shapes and arrows</b>.':'Введите любой текст. Одна буква, например <b>a</b>, <b>(a)</b>, <b>C)</b>, <b>а</b> или <b>(А)</b>, автоматически продолжается на следующих рисунках (b, c… или б, в… по ГОСТ, без ё з й о ч ъ ы ь); любой другой текст ставится как есть на каждый рисунок. Изменить букву отдельного рисунка можно в блоке <b>Масштабная подпись и буква на этом рисунке</b>, свободный текст добавляется кнопкой <b>+ Текст</b> в блоке <b>Текст, фигуры и стрелки</b>.',
'Advanced settings':'Дополнительные настройки','Bar thickness / font size':'Толщина шкалы / размер шрифта','Bar ↔ text gap / font size':'Зазор шкала ↔ текст / размер шрифта','Show the detected footer boundary, original bar and label in the preview':'Показывать на превью найденную границу плашки, исходную шкалу и подпись','Default':'По умолчанию',
'Output files':'Выходные файлы','Output folder: browser default':'Папка сохранения: по умолчанию браузера',
'Each processed image is saved as its own file, for example <code>Co-1_clean.png</code>. <b>TIFF</b>, <b>PDF</b> and <b>SVG</b> hold the same lossless image at 300 dpi. On Chrome/Edge desktop you can select an output folder once and save all files directly into it.':'Каждый обработанный рисунок сохраняется отдельным файлом, например <code>Co-1_clean.png</code>. <b>TIFF</b>, <b>PDF</b> и <b>SVG</b> содержат тот же рисунок без потерь при 300 dpi. В Chrome/Edge на компьютере можно один раз выбрать папку и сохранять все файлы прямо в неё.',
'Select output folder':'Выбрать папку','Save all PNGs separately':'Сохранить все PNG по отдельности','Save all TIFF':'Сохранить все TIFF','Save all PDF':'Сохранить все PDF','Save all SVG':'Сохранить все SVG','Download ZIP':'Скачать ZIP','CSV audit':'CSV-отчёт',
'2. Preview and control':'2. Просмотр и управление','Add at least one image.':'Добавьте хотя бы один рисунок.','Process all':'Обработать все','Process new':'Обработать новые','Process selected':'Обработать выбранное',
'No files yet':'Файлов пока нет','After importing files, you will see the image list here and a before/after comparison.':'После загрузки здесь появится список рисунков и сравнение «до/после».',
'Order: drag a file, or move the selected one':'Порядок: перетащите файл или сдвиньте выбранный','Picture (no scale bar)':'Рисунок (без шкалы)','Source':'Исходник','Large view':'Крупно','Crop tool':'Обрезка',
'The dimmed area is removed. With <b>Crop tool</b> on, drag an edge or corner (a magnifier shows exact pixels; edges snap to the image border and footer line, hold <b>Alt</b> to disable snapping), drag inside to move, or draw a new box outside. Arrow keys nudge the last-used edge (Shift = 10 px).':'Затемнённая область удаляется. При включённой <b>Обрезке</b> тяните за край или угол (лупа показывает точные пиксели; края прилипают к границе рисунка и линии плашки, удерживайте <b>Alt</b>, чтобы отключить прилипание), тяните внутри, чтобы сдвинуть, или нарисуйте новую рамку снаружи. Стрелки сдвигают последний край (Shift = 10 px).',
'Result':'Результат','Click to select. Drag the scale bar, text, shapes and arrows to move them; drag handles to resize.':'Нажмите, чтобы выбрать. Перетаскивайте шкалу, букву, текст, фигуры и стрелки; тяните за маркеры, чтобы изменить размер.',
'Footer':'Плашка','Original bar':'Исходная шкала','OCR read':'Распознано','Source scale':'Исходный масштаб','Output scale':'Итоговый масштаб','Output bar':'Итоговая шкала',
'Calibration (original image)':'Калибровка (исходный рисунок)','Source scale value':'Исходное значение масштаба','Original bar, px':'Исходная шкала, px','Apply calibration':'Применить калибровку','Auto read this file':'Распознать этот файл',
'Output scale bar':'Итоговая шкала','Output scale value':'Итоговое значение масштаба','Bar length, px':'Длина шкалы, px','Bar thickness, px':'Толщина шкалы, px','Scale → Length':'Масштаб → Длина','Length → Scale':'Длина → Масштаб','Reset positions':'Сбросить положения','Redraw':'Перерисовать','Save selected PNG':'Сохранить выбранный PNG',
'Editing the output scale value recalculates the bar length from the original calibration. <b>Save selected PNG</b> saves only the current image. On iPhone/iPad the iOS Share Sheet is used; choose <b>Save to Files</b> or <b>Save Image</b>.':'Изменение итогового масштаба пересчитывает длину шкалы по исходной калибровке. <b>Сохранить выбранный PNG</b> сохраняет только текущий рисунок. На iPhone/iPad открывается меню «Поделиться»; выберите <b>Сохранить в Файлы</b> или <b>Сохранить изображение</b>.',
'Crop':'Обрезка','Left, px':'Слева, px','Top, px':'Сверху, px','Width, px':'Ширина, px','Height, px':'Высота, px','Aspect ratio':'Соотношение сторон','Free':'Свободно','Auto (remove footer)':'Авто (убрать плашку)','Apply crop to all':'Обрезать все так же',
'Cropping does not resample the image, so the scale bar calibration stays exact.':'Обрезка не пересчитывает пиксели, поэтому калибровка шкалы остаётся точной.',
'Scale label and panel letter on this image':'Масштабная подпись и буква на этом рисунке',
'Empty fields follow the main <b>Scale label</b> and <b>Panel letter</b> settings.':'Пустые поля берут значения из основных настроек <b>Масштабная подпись</b> и <b>Буква панели</b>.',
'Text, shapes and arrows':'Текст, фигуры и стрелки',
'+ Text':'+ Текст','▭ Rectangle':'▭ Прямоугольник','⬚ Dashed rectangle':'⬚ Пунктирный прямоугольник','◯ Circle':'◯ Круг','◌ Dashed circle':'◌ Пунктирный круг','→ Arrow':'→ Стрелка','— Line':'— Линия',
'Ctrl + click texts or objects to select several':'Ctrl + клик по текстам или объектам, чтобы выбрать несколько',
'═ Same line':'═ В одну строку','⤒ Tops':'⤒ По верху','⤓ Bottoms':'⤓ По низу','║ Same column':'║ В один столбец','⇤ Lefts':'⇤ По левому краю','⇥ Rights':'⇥ По правому краю','↔ Distribute':'↔ Распределить','↕ Distribute':'↕ Распределить','Same text size':'Одинаковый размер текста','Duplicate':'Дублировать','Copy to all images':'Копировать на все рисунки',
'Size, pt (0 = unit size)':'Размер, pt (0 = как подпись)','Color':'Цвет','Line width, px':'Толщина линии, px','Length, px':'Длина, px','Head size, px (0 = auto)':'Размер наконечника, px (0 = авто)','Fill color':'Цвет заливки','Fill opacity, %':'Непрозрачность заливки, %','Outline color':'Цвет обводки',
'Underline':'Подчёркнутый','Strikethrough':'Зачёркнутый','Background highlight':'Подложка','Dashed line':'Пунктир','Fill':'Заливка','Keep square / circle':'Сохранять квадрат / круг','Double-headed':'Двусторонняя','Contrast outline':'Контрастная обводка',
'Click an object on the Result preview to select it, drag to move, drag the handles to resize (hold <b>Shift</b> for a square/circle or 15° arrow steps). Arrow keys nudge the selected object, <b>Delete</b> removes it. In text, select characters and use the toolbar, or type <code>&lt;sub&gt;…&lt;/sub&gt;</code>, <code>&lt;sup&gt;</code>, <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;s&gt;</code>, or the shortcuts <code>H_{2}O</code>, <code>m^{2}</code>. Enter starts a new line. The panel letter is enabled in <b>Panel letter</b> on the left.':'Нажмите на объект на превью результата, чтобы выбрать его; тяните, чтобы сдвинуть, тяните за маркеры, чтобы изменить размер (<b>Shift</b> — квадрат/круг или шаг стрелки 15°). Стрелки на клавиатуре сдвигают выбранный объект, <b>Delete</b> удаляет его. В тексте выделите символы и используйте панель, или вводите <code>&lt;sub&gt;…&lt;/sub&gt;</code>, <code>&lt;sup&gt;</code>, <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;s&gt;</code>, или сокращения <code>H_{2}O</code>, <code>m^{2}</code>. Enter — новая строка. Буква панели включается в блоке <b>Буква панели</b> слева.',
'File':'Файл','Status':'Статус','Footer y':'Плашка, y','Output bar, px':'Итоговая шкала, px',
'1. Panels':'1. Панели','Processed images from the Clean & annotate tab.':'Обработанные рисунки из вкладки «Очистка и аннотации».','Refresh':'Обновить',
'Untick a panel to leave it out. Reorder with ↑ ↓, or click one panel in the preview and then another to swap them.':'Снимите галочку, чтобы исключить панель. Меняйте порядок кнопками ↑ ↓ или нажмите одну панель на превью, затем другую, чтобы поменять их местами.',
'Images per row':'Рисунков в ряду','Arrangement':'Раскладка','Equal row height':'Одинаковая высота рядов','Equal cells':'Одинаковые ячейки','Free (drag & resize)':'Свободно (перетаскивание)',
'One number (e.g. <b>2</b>) gives the same count in every row; a pattern (e.g. <b>3,2</b> or <b>1,2</b>) sets each row. <b>Equal row height</b> keeps every image whole and fills the width. <b>Equal cells</b> fits each image inside identical cells. Images are never cropped or stretched, so scale bars stay exact.':'Одно число (например <b>2</b>) задаёт одинаковое количество в каждом ряду; шаблон (например <b>3,2</b> или <b>1,2</b>) задаёт каждый ряд. <b>Одинаковая высота рядов</b> сохраняет рисунки целиком и заполняет ширину. <b>Одинаковые ячейки</b> вписывает каждый рисунок в одинаковые ячейки. Рисунки не обрезаются и не растягиваются, поэтому шкалы остаются точными.',
'Drag a panel in the preview to move it, or drag the corner handles of the selected panel to resize it (aspect ratio kept). This switches to <b>Free</b>. Panels snap to edges, centre and spacing; hold Alt to place freely.':'Перетащите панель на превью, чтобы сдвинуть её, или тяните за угловые маркеры выбранной панели, чтобы изменить размер (пропорции сохраняются). Раскладка переключится на <b>Свободно</b>. Панели прилипают к краям, центру и отступам; удерживайте Alt для свободного размещения.',
'Reset free layout':'Сбросить свободную раскладку','Size':'Размер','Figure width, cm':'Ширина рисунка, см','Resolution':'Разрешение','Spacing between images, mm':'Промежуток между рисунками, мм','Outer margin, mm':'Внешнее поле, мм','Background':'Фон','Transparent (PNG)':'Прозрачный (PNG)',
'8.5 cm ≈ one journal column, 17 cm ≈ full page width. The saved file carries this size, so Word inserts it at the right width.':'8,5 см ≈ одна колонка журнала, 17 см ≈ полная ширина страницы. Файл сохраняется с этим размером, и Word вставляет его нужной ширины.',
'Labels':'Подписи','Panel letters':'Буквы панелей','Renumber a, b, c… in figure order':'Перенумеровать a, b, c… по порядку в рисунке','As set in the Clean tab':'Как во вкладке «Очистка»','No panel letters':'Без букв',
'Keep true point sizes in the final figure (labels are redrawn for each panel\'s printed size)':'Сохранять истинные размеры в pt в итоговом рисунке (подписи перерисовываются под печатный размер каждой панели)',
'Letter format, size and highlight come from <b>Panel letter</b> in the Clean tab.':'Формат, размер и подложка буквы берутся из блока <b>Буква панели</b> во вкладке «Очистка».',
'Scale label and letter per panel':'Подпись и буква для панели','no panel selected':'панель не выбрана',
'Click a panel on the preview (or its name in the list) to edit it. Changes are shared with the Clean tab.':'Нажмите на панель на превью (или на её имя в списке), чтобы изменить её. Изменения общие с вкладкой «Очистка».',
'Drawn on the whole figure, on top of the panels (e.g. arrows pointing between panels or a frame around a region). Click an object on the preview to select it, drag to move, drag handles to resize; <b>Delete</b> removes it. Text sizes are true points in the final figure.':'Рисуются на всём рисунке поверх панелей (например, стрелки между панелями или рамка вокруг области). Нажмите на объект на превью, чтобы выбрать его, тяните, чтобы сдвинуть, тяните за маркеры, чтобы изменить размер; <b>Delete</b> удаляет. Размеры текста — истинные pt в итоговом рисунке.',
'Save PNG':'Сохранить PNG','Save TIFF':'Сохранить TIFF','Copy':'Копировать','2. Figure preview':'2. Просмотр рисунка','No panels yet.':'Панелей пока нет.','No processed images':'Нет обработанных рисунков',
'Process images in the Clean & annotate tab; they appear here automatically.':'Обработайте рисунки во вкладке «Очистка и аннотации», они появятся здесь автоматически.','Figure':'Рисунок','Click a panel, then click another panel to swap them.':'Нажмите на панель, затем на другую, чтобы поменять их местами.',
'1. EDS input':'1. Данные ЭДРС','AZtec Word reports (.docx) or loose map images.':'Отчёты AZtec в Word (.docx) или отдельные рисунки карт.','Drop EDS report or maps':'Перетащите отчёт ЭДРС или карты',
'Images inside a .docx are extracted in document order and named from their captions (e.g. <b>Fe Kα1</b>, <b>Electron Image 1</b>, <b>Map Sum Spectrum</b>). Loose images are named from the file name (e.g. <b>Fe_Ka1.png</b>). Old .doc files must be re-saved as .docx.':'Рисунки из .docx извлекаются по порядку и получают имена из подписей (например <b>Fe Kα1</b>, <b>Electron Image 1</b>, <b>Map Sum Spectrum</b>). Отдельные рисунки называются по имени файла (например <b>Fe_Ka1.png</b>). Старые файлы .doc нужно пересохранить как .docx.',
'Selected image':'Выбранный рисунок','Type':'Тип','Electron image':'Электронный рисунок','Element map':'Карта элемента','Layered map':'Совмещённая карта','Spectrum':'Спектр','Label color':'Цвет подписи','Label':'Подпись','Apply to all maps':'Применить ко всем картам',
'Works like Picture Corrections in Word: −100…+100 %, 0 = original.':'Работает как «Коррекция рисунка» в Word: −100…+100 %, 0 = исходное.','Auto levels':'Автоуровни','Auto levels for all maps':'Автоуровни для всех карт','Save this PNG':'Сохранить этот PNG',
'Clean-up (all images)':'Очистка (все рисунки)','Remove software labels and scale bars burned into the images':'Убрать впечатанные программой подписи и шкалы','Show the detected areas in the preview (red)':'Показывать найденные области на превью (красным)',
'Trim top, %':'Обрезать сверху, %','Trim bottom, %':'Обрезать снизу, %','Trim left, %':'Обрезать слева, %','Trim right, %':'Обрезать справа, %','Erase area tool':'Стирание области','Clear erased areas':'Очистить стёртые области',
'If a label or bar is missed, turn on <b>Erase area tool</b> and drag a box over it on any image in the preview. The same area is erased on every image (they share the field of view), filled with the surrounding background.':'Если подпись или шкала пропущена, включите <b>Стирание области</b> и обведите её рамкой на любом рисунке превью. Та же область стирается на всех рисунках (у них общее поле зрения) и заполняется окружающим фоном.',
'The same crop is applied to the electron image and every map, so they stay aligned. Trimming does not resample, so calibration stays exact.':'Одинаковая обрезка применяется к электронному рисунку и всем картам, поэтому они совпадают. Обрезка не пересчитывает пиксели, калибровка остаётся точной.',
'Element labels':'Подписи элементов','Element + line (Fe Kα1)':'Элемент + линия (Fe Kα1)','Element only (Fe)':'Только элемент (Fe)','Same as map color':'Как цвет карты','Background highlight behind the label':'Подложка под подписью',
'Labels sit in the upper-left corner of each map. The font family comes from the <b>Font</b> section in tab 1.':'Подписи стоят в левом верхнем углу каждой карты. Шрифт берётся из блока <b>Шрифт</b> во вкладке 1.',
'Element content':'Содержание элементов','no values':'нет значений','Write the content at the bottom center of each element map':'Писать содержание внизу по центру каждой карты элемента','Show':'Показывать','Weight % (wt.%)':'Массовые % (wt.%)','Atomic % (at.%)':'Атомные % (at.%)','Unit text':'Текст единицы','Decimals':'Знаков после запятой',
'Values: element, wt.%, at.% (one per line)':'Значения: элемент, wt.%, at.% (по одному в строке)','Read from spectrum / report':'Прочитать из спектра / отчёта',
'Values come from quantification tables in the Word report or, if there are none, from text recognition of the spectrum image. Check and correct them in the box. Color, bold and highlight follow <b>Element labels</b>.':'Значения берутся из таблиц количественного анализа в отчёте Word, а если их нет — из распознавания рисунка спектра. Проверьте и исправьте их в поле. Цвет, жирность и подложка — как в <b>Подписях элементов</b>.',
'Scale bar':'Масштабная шкала','not calibrated':'не откалибровано','Known length':'Известная длина','= px on electron image':'= px на электронном рисунке','Auto read from electron image':'Распознать с электронного рисунка','Show on':'Показывать на','Electron image only':'Только электронном рисунке','Every image':'Всех рисунках','None':'Нет','Bar value (empty = auto)':'Значение шкалы (пусто = авто)',
'Maps share the field of view of the electron image, so one calibration covers all of them (scaled by pixel size if the map resolution differs). Bar style, color and unit language follow tab 1.':'Карты имеют то же поле зрения, что и электронный рисунок, поэтому одной калибровки хватает для всех (с учётом размера пикселя, если разрешение карты другое). Стиль, цвет шкалы и язык единиц — как во вкладке 1.',
'Figure layout':'Раскладка рисунка','Electron image large, maps on the right':'Электронный рисунок крупно, карты справа','Equal tiles, electron image first':'Одинаковые плитки, электронное первым','One row':'В один ряд','Map columns (0 = auto)':'Столбцов карт (0 = авто)','Spacing, mm':'Промежуток, мм',
'A spectrum, if included, is placed full width below the maps.':'Спектр, если включён, ставится на всю ширину под картами.','Save figure PNG':'Сохранить рисунок PNG','Save maps (ZIP)':'Сохранить карты (ZIP)','Send maps to Compose':'Отправить карты в сборку','Send figure to Compose':'Отправить рисунок в сборку',
'2. EDS figure preview':'2. Просмотр рисунка ЭДРС','No images yet.':'Рисунков пока нет.','No EDS data yet':'Данных ЭДРС пока нет','Drop an AZtec Word report or element map images on the left.':'Перетащите слева отчёт AZtec в Word или рисунки карт элементов.',
'Click an image to select it and adjust its label, brightness and contrast.':'Нажмите на рисунок, чтобы выбрать его и настроить подпись, яркость и контраст.',
'<b>Important:</b> the original files are not modified. The output is a PNG intended for publication figures. Keep the original image files separately for quantitative analysis.':'<b>Важно:</b> исходные файлы не изменяются. На выходе — PNG для рисунков в публикациях. Для количественного анализа храните исходные файлы рисунков отдельно.',
// titles, placeholders and messages
'Views':'Вкладки','Pick bar':'Выбрать шкалу','Scale value kept':'Значение сохранено','Drag a box around the scale bar and its label on the Source image.':'Обведите рамкой шкалу и её подпись на исходном рисунке.','Drag a box around the scale bar and its label on the Source image. The bar is measured and the label read inside the box.':'Обведите рамкой шкалу и её подпись на исходном рисунке. Шкала измеряется, а подпись читается внутри рамки.','No scale bar found in the box. Draw it closer around the bar line.':'В рамке шкала не найдена. Обведите линию шкалы плотнее.','Scale bar picked':'Шкала выбрана','Bar measured':'Шкала измерена','No label found — enter the scale value in Calibration and click Apply calibration.':'Подпись не найдена — введите значение в Calibration и нажмите Apply calibration.','Draw a larger box around the bar.':'Нарисуйте рамку побольше вокруг шкалы.','Select an image first.':'Сначала выберите рисунок.','Scale bar picked by hand.':'Шкала выбрана вручную.','Erase the original scale bar in optical images':'Стирать исходную шкалу на оптических рисунках','Optical-microscope scale bar found inside the image. Process reads it, erases the original and draws a new bar in its place.':'Найдена шкала оптического микроскопа внутри рисунка. Process считывает её, стирает исходную и рисует новую на её месте.','Images are not uploaded to a server':'Рисунки не загружаются на сервер','e.g. Journal, Russian':'напр. Журнал, Русский','Manual source scale value':'Исходное значение масштаба вручную','Unit':'Единица','Thickness 0.18, gap 0.12, detection overlay off':'Толщина 0,18, зазор 0,12, показ обнаружения выкл.',
'Only images that have not been processed yet':'Только ещё не обработанные рисунки','Only the selected image':'Только выбранный рисунок','Move selected image earlier':'Сдвинуть выбранное раньше','Move selected image later':'Сдвинуть выбранное позже',
'Pictures without footer/scale bar (schematics, photos) are shown and editable at once; other images need Process':'Рисунки без плашки и шкалы (схемы, фото) сразу доступны для правки; остальные рисунки нужно обработать',
'e.g. 1':'напр. 1','detected':'найдено','e.g. 2':'напр. 2','auto':'авто','Put the scale bar and the panel letter back to their default corners':'Вернуть шкалу и букву панели в углы по умолчанию',
'Put all on one line (same vertical center as the first selected)':'Поставить в одну строку (по центру первого выбранного)','Align top edges':'Выровнять по верху','Align bottom edges':'Выровнять по низу','Put all in one column (same horizontal center as the first selected)':'Поставить в один столбец (по центру первого выбранного)','Align left edges':'Выровнять по левому краю','Align right edges':'Выровнять по правому краю',
'Equal gaps left to right (3 or more)':'Равные промежутки слева направо (от 3)','Equal gaps top to bottom (3 or more)':'Равные промежутки сверху вниз (от 3)','Give all selected texts the size of the first selected':'Дать всем выбранным текстам размер первого',
'Bold selection':'Жирный','Italic selection':'Курсив','Underline selection':'Подчеркнуть','Strikethrough selection':'Зачеркнуть','Superscript':'Верхний индекс','Subscript':'Нижний индекс',
'e.g. 2 or 3,2':'напр. 2 или 3,2','e.g. Fe Kα1':'напр. Fe Kα1','Copy brightness, contrast and sharpness of this image to all maps':'Копировать яркость, контраст и резкость этого рисунка на все карты','e.g. 25':'напр. 25','e.g. 180':'напр. 180',
'Interface language':'Язык интерфейса','Scale label and panel letter on this image (optional)':'Масштабная подпись и буква на этом рисунке (необязательно)','If the element was not recognised, type it here (e.g. <b>Cr</b> or <b>Cr Kα1</b>). Its content from <b>Element content</b> then appears on this map.':'Если элемент не распознан, введите его здесь (например <b>Cr</b> или <b>Cr Kα1</b>). Его содержание из блока <b>Содержание элементов</b> появится на этой карте.','Fit':'Вписать','Fit to window':'Вписать в окно','Zoom in (Ctrl + wheel)':'Увеличить (Ctrl + колесо)','Zoom out (Ctrl + wheel)':'Уменьшить (Ctrl + колесо)','Drag to resize the panel · double-click to reset':'Тяните, чтобы изменить ширину панели · двойной клик — сброс','Delete theme':'Удалить тему',
// scale label / letter editor and status texts
'EDS image(s) updated from the EDS maps tab.':'ЭДРС-рисунки обновлены из вкладки «Карты ЭДРС».',
'Remove this image (also from the Clean & annotate tab)':'Удалить этот рисунок (также из вкладки «Очистка и аннотации»)',
'Remove all panels (also from the Clean & annotate tab)':'Удалить все панели (также из вкладки «Очистка и аннотации»)',
'Remove all panels? The images are also removed from the Clean & annotate tab.':'Удалить все панели? Рисунки также будут удалены из вкладки «Очистка и аннотации».',
'Show on this image':'Показывать на этом рисунке','Letter':'Буква','Highlight':'Подложка','On':'Вкл.','Off':'Выкл.','Reset to default':'Сбросить','Apply style to all':'Стиль для всех','Delete from all':'Убрать со всех','Show on all':'Показать на всех','Same as scale label':'Как масштабная подпись',
'Working':'Обработка','Picture':'Рисунок','Ready':'Готово','Error':'Ошибка','Waiting':'Ожидание','reading…':'чтение…','no bar':'нет шкалы','Rectangle':'Прямоугольник','Circle':'Круг','Arrow':'Стрелка','Line':'Линия',
'Ctrl + click texts or objects (on the image or in the list above) to select several and align them.':'Ctrl + клик по текстам или объектам (на рисунке или в списке выше), чтобы выбрать несколько и выровнять.',
'Treat as image with scale bar':'Считать рисунком со шкалой','Treat as picture (no scale bar)':'Считать рисунком (без шкалы)','Process this image':'Обработать этот рисунок','Process this image again':'Обработать заново','Drag to change the order':'Перетащите, чтобы изменить порядок',
'Treated as a picture: no scale bar, ready to annotate.':'Считается рисунком: без шкалы, можно аннотировать.','Treated as image with scale bar: press Process.':'Считается рисунком со шкалой: нажмите «Обработать».',
'All panels are excluded.':'Все панели исключены.','All images are excluded.':'Все рисунки исключены.','No processed images yet. Process images in the Clean & annotate tab first.':'Обработанных рисунков пока нет. Сначала обработайте их во вкладке «Очистка и аннотации».',
'No calibration for this image, so there is no scale bar to show.':'Для этого рисунка нет калибровки, шкалу показать нельзя.','Panel letters are off for the whole figure (Labels → No panel letters).':'Буквы отключены для всего рисунка (Подписи → Без букв).',
'No supported files were found.':'Поддерживаемые файлы не найдены.','The first selected object must be a text.':'Первый выбранный объект должен быть текстом.','Select at least 3 objects to distribute.':'Выберите не меньше 3 объектов для распределения.',
'This browser cannot write directly to a chosen folder. Use Chrome/Edge on desktop, or save each PNG with the Save button.':'Этот браузер не умеет сохранять прямо в выбранную папку. Используйте Chrome/Edge на компьютере или сохраняйте PNG кнопкой «Сохранить».',
'There are no processed PNG files to save.':'Нет обработанных PNG для сохранения.','ZIP is ready.':'ZIP готов.','Bar length updated from the scale value.':'Длина шкалы пересчитана по масштабу.','Scale text updated from the bar length.':'Масштаб пересчитан по длине шкалы.',
'Brightness, contrast and sharpness applied to all images.':'Яркость, контраст и резкость применены ко всем рисункам.','Enter a name for the theme.':'Введите название темы.','This file is not a theme.':'Этот файл не является темой.',
'Font imported and stored in this browser.':'Шрифт импортирован и сохранён в браузере.','Imported font removed from this browser.':'Импортированный шрифт удалён из браузера.','Enter a valid manual source scale.':'Введите правильное исходное значение масштаба.',
'Advanced settings restored to defaults.':'Дополнительные настройки сброшены.','Calibration applied to this file.':'Калибровка применена к файлу.','Selected file redrawn.':'Выбранный файл перерисован.','Process the selected image first.':'Сначала обработайте выбранный рисунок.',
'Crop applied to all images.':'Обрезка применена ко всем рисункам.','Added. It appears on the Result after the file is processed.':'Добавлено. Появится на результате после обработки файла.','CSV save started.':'Сохранение CSV началось.',
'Figure copied. Paste it into Word or PowerPoint.':'Рисунок скопирован. Вставьте его в Word или PowerPoint.','Copy is not allowed here; use Save PNG instead.':'Копирование здесь недоступно, используйте «Сохранить PNG».',
'No electron image found. Set an image type to “Electron image” first.':'Электронный рисунок не найден. Сначала задайте тип «Электронный рисунок».',
'Could not read the scale bar automatically. Enter the known length and its length in px.':'Не удалось распознать шкалу. Введите известную длину и её длину в px.',
'Brightness, contrast and sharpness applied to all maps.':'Яркость, контраст и резкость применены ко всем картам.',
'No spectrum found. Set an image type to “Spectrum”, or type the values in the box.':'Спектр не найден. Задайте тип «Спектр» или введите значения в поле.',
'No element percentages found in the spectrum image. Type the values in the box.':'На рисунке спектра не найдены проценты элементов. Введите значения в поле.',
'Enter the known length and its length in px.':'Введите известную длину и её длину в px.','Calibration applied to all EDS images.':'Калибровка применена ко всем рисункам ЭДРС.','Saved.':'Сохранено.','EDS figure sent to Compose figure as one panel.':'Рисунок ЭДРС отправлен в сборку как одна панель.',
'No scale bar yet: enter a known length on the electron image or use Auto read.':'Шкалы пока нет: введите известную длину на электронном рисунке или используйте распознавание.',
'Original scale bar was not detected. Enter “Original bar, px” in Calibration below.':'Исходная шкала не найдена. Введите «Исходная шкала, px» в блоке «Калибровка» ниже.',
'Scale value must be greater than zero.':'Значение масштаба должно быть больше нуля.','Scale text must look like: 1 µm, 500 nm, 2 mm, 1 m, 5 Å or 2 nm⁻¹.':'Масштаб должен выглядеть так: 1 µm, 500 nm, 2 mm, 1 m, 5 Å или 2 nm⁻¹.',
'Output unit must be the same kind as the source unit (length or reciprocal).':'Итоговая единица должна быть того же вида, что исходная (длина или обратная).','Original bar length is unknown.':'Длина исходной шкалы неизвестна.',
'Original bar length must be greater than zero.':'Длина исходной шкалы должна быть больше нуля.','Bar length must be greater than zero.':'Длина шкалы должна быть больше нуля.',
'Footer was not detected automatically.':'Плашка не найдена автоматически.','Detected footer is too small.':'Найденная плашка слишком мала.',
'No image footer found, so the scale cannot be read automatically. Enter the source scale and original bar length in Calibration.':'Плашка рисунка не найдена, масштаб нельзя прочитать автоматически. Введите исходный масштаб и длину шкалы в блоке «Калибровка».',
'Source scale is unknown. Enter it in Calibration below.':'Исходный масштаб неизвестен. Введите его в блоке «Калибровка» ниже.','Could not create PNG.':'Не удалось создать PNG.','Process this image first.':'Сначала обработайте этот рисунок.',
'The browser blocked the download. Allow downloads/pop-ups for this page and try again.':'Браузер заблокировал загрузку. Разрешите загрузки/всплывающие окна для этой страницы и повторите.',
'Set the calibration first (process the file or enter the source scale).':'Сначала задайте калибровку (обработайте файл или введите исходный масштаб).','Process this file first, or enter the calibration.':'Сначала обработайте файл или введите калибровку.',
'The scale annotation is larger than the image. Reduce the font size or the output scale.':'Масштабная подпись больше рисунка. Уменьшите шрифт или итоговый масштаб.','The crop includes part of the image footer.':'Обрезка захватывает часть плашки рисунка.',
'There are no processed files to save.':'Нет обработанных файлов для сохранения.',
'Add images first.':'Сначала добавьте рисунки.',
'Select at least 3 panels to distribute.':'Выберите не менее 3 панелей для распределения.',
'Add EDS maps first.':'Сначала добавьте карты ЭДРС.',
'Add EDS maps or values first.':'Сначала добавьте карты ЭДРС или значения.',
'No':'№','Length (µm)':'Длина (мкм)','Eq. diameter (µm)':'Экв. диаметр (мкм)','Area (µm²)':'Площадь (мкм²)','Major axis (µm)':'Большая ось (мкм)','Minor axis (µm)':'Малая ось (мкм)','Perimeter (µm)':'Периметр (мкм)','Angle (°)':'Угол (°)','Length or eq. diameter (px)':'Длина или экв. диаметр (пкс)','Area (px²)':'Площадь (пкс²)','µm per px':'мкм на пкс','Multi-page TIFF: only the first page is used.':'Многостраничный TIFF: используется только первая страница.','TIFF size is invalid or too large.':'Размер TIFF неверен или слишком велик.',
};
const PAT=[
[/^(.+?): (.+?) is too large to open \(over 500 MB or 500 images when unpacked\)\.$/,m=>`${m[1]}: файл ${m[2]} слишком велик для открытия (более 500 МБ или 500 рисунков после распаковки).`],
[/^(.+?): (.+?) is not a Word \.docx file\.$/,m=>`${m[1]}: ${m[2]} не является файлом Word .docx.`],
[/^Could not open the session: (.+?)\.? Your current work was kept\.$/,m=>`Не удалось открыть сеанс: ${m[1]}. Текущая работа сохранена.`],
[/^Could not open the session: (.+)$/,m=>`Не удалось открыть сеанс: ${m[1]}`],
[/^ZIP: (.+)$/,m=>`ZIP: ${m[1]}`],
[/^(\d+) file\(s\) • ready: (\d+)(?: • errors: (\d+))?$/,(m)=>`${m[1]} файл(ов) • готово: ${m[2]}`+(m[3]?` • ошибок: ${m[3]}`:'')],
[/^(\d+) panel\(s\) • (.+) cm at (\d+) dpi$/,m=>`${m[1]} панел(ей) • ${m[2]} см, ${m[3]} dpi`],
[/^(\d+) map\(s\)( \+ electron image)? • (.+) cm at (\d+) dpi$/,m=>`${m[1]} карт(ы)${m[2]?' + электронный рисунок':''} • ${m[3]} см, ${m[4]} dpi`],
[/^Theme imported: (.+)\. Press Apply to use it\.$/,m=>`Тема импортирована: ${m[1]}. Нажмите «Применить».`],
[/^(\d+) PNG file\(s\) saved separately to (.+)\.$/,m=>`${m[1]} PNG сохранено в ${m[2]}.`],
[/^(\d+) separate PNG download\(s\) started\. If asked, allow multiple downloads\.$/,m=>`Начато скачивание ${m[1]} PNG. Если браузер спросит, разрешите несколько загрузок.`],
[/^Process new \((\d+)\)$/,m=>`Обработать новые (${m[1]})`],
[/^(.+) \/ system$/,m=>`${m[1]} / системный`],[/^(.+) \/ not confirmed$/,m=>`${m[1]} / не подтверждён`],[/^(.+) \/ imported$/,m=>`${m[1]} / импортирован`],
[/^Auto read failed \(OCR: “(.*)”\)\. Enter the source scale in Calibration below and click Apply calibration\.$/,m=>`Распознать не удалось (OCR: «${m[1]}»). Введите исходный масштаб в блоке «Калибровка» и нажмите «Применить калибровку».`],
[/^Auto read failed \(OCR: “(.*)”\)\. The bar was found \((\d+)px\); enter the source scale in Calibration below and click Apply calibration\.$/,m=>`Распознать не удалось (OCR: «${m[1]}»). Шкала найдена (${m[2]} пкс); введите исходный масштаб в блоке «Калибровка» и нажмите «Применить калибровку».`],
[/^(\d+) selected — aligned to the first one you picked \(thick outline\)\.$/,m=>`Выбрано: ${m[1]} — выравнивание по первой выбранной панели (толстая рамка).`],
[/^Dashed (.+)$/,m=>'Пунктир: '+(RU[m[1]]||m[1]).toLowerCase()],
];
const PREFIX=[['Saved: ','Сохранено: '],['Save failed: ','Ошибка сохранения: '],['Theme applied: ','Тема применена: '],['Theme deleted: ','Тема удалена: '],['Theme updated: ','Тема обновлена: '],['Theme saved: ','Тема сохранена: '],['Output folder selected: ','Выбрана папка: '],['Folder selection failed: ','Не удалось выбрать папку: '],['Manual source scale applied: ','Применён исходный масштаб: '],['Processing finished: ','Обработка завершена: '],['Output folder: ','Папка сохранения: '],['Imported: ','Импортировано: '],['Copied to ','Скопировано на '],['Scale read from the map: ','Масштаб с карты: '],['Scale read from the electron image: ','Масштаб с электронного рисунка: '],['Reading failed: ','Ошибка чтения: '],['Skipped ','Пропущено '],['Font: ','Шрифт: '],['Example: ','Пример: '],['Read ','Прочитано ']];
const norm=s=>s.replace(/\s+/g,' ').trim();
function tr(s){
  const k=norm(s); if (!k) return null;
  if (RU[k]!=null) return RU[k];
  for (const [re,f] of PAT) { const m=k.match(re); if (m) return f(m); }
  for (const [a,b] of PREFIX) if (k.startsWith(a) && k.length>a.length) { const rest=k.slice(a.length); return b+(RU[rest]??rest); }
  return null;
}
const INL=new Set(['B','I','U','S','CODE','SUP','SUB','BR','STRONG','EM','A']);
const SKIP=new Set(['SCRIPT','STYLE','CANVAS','TEXTAREA','svg','SVG']);
const done=new Set(); let lang='en';
function inlineOnly(el){ if (!el.firstElementChild) return false; for (const c of el.children) { if (!INL.has(c.tagName) || c.id || c.querySelector('[id]')) return false; } return true; }
function doAttrs(el){
  for (const a of ['title','placeholder','aria-label']) { const v=el.getAttribute(a); if (!v) continue;
    const st=el.__i18a||(el.__i18a={}), rec=st[a];
    if (rec && v===rec.ru) continue;
    const r=tr(v); if (r!=null && r!==v) { st[a]={en:v,ru:r}; el.setAttribute(a,r); done.add(el); }
  }
}
function doText(n){
  const v=n.nodeValue; if (n.__i18 && v===n.__i18.ru) return;
  const r=tr(v); if (r==null || r===norm(v)) return;
  const lead=v.match(/^\s*/)[0], trail=v.match(/\s*$/)[0], ru=lead+r+trail;
  n.__i18={en:v,ru}; n.nodeValue=ru; done.add(n);
}
function walk(node){
  if (node.nodeType===3) { if (node.parentElement && !node.parentElement.isContentEditable) doText(node); return; }
  if (node.nodeType!==1 || SKIP.has(node.tagName) || node.isContentEditable || node.hasAttribute('data-noi18n')) return;
  doAttrs(node);
  if (inlineOnly(node)) {
    const h=node.innerHTML; if (node.__i18h && h===node.__i18h.ru) return;
    const r=RU[norm(h.replace(/\s+data-om-[\w-]+="[^"]*"/g,''))]; if (r!=null) { node.__i18h={en:h,ru:r}; node.innerHTML=r; done.add(node); return; }
  }
  for (let c=node.firstChild;c;c=c.nextSibling) walk(c);
}
function restore(){
  for (const n of done) {
    if (!n.isConnected) continue;
    if (n.nodeType===3) { if (n.__i18 && n.nodeValue===n.__i18.ru) n.nodeValue=n.__i18.en; n.__i18=null; continue; }
    if (n.__i18h) { if (n.innerHTML===n.__i18h.ru) n.innerHTML=n.__i18h.en; n.__i18h=null; }
    if (n.__i18a) { for (const a in n.__i18a) { const rec=n.__i18a[a]; if (n.getAttribute(a)===rec.ru) n.setAttribute(a,rec.en); } n.__i18a=null; }
  }
  done.clear();
}
const obs=new MutationObserver(list=>{
  if (lang!=='ru') return;
  for (const m of list) {
    if (m.type==='childList') m.addedNodes.forEach(walk);
    else if (m.type==='characterData') walk(m.target);
    else if (m.type==='attributes') doAttrs(m.target);
  }
  if (done.size>3000) for (const n of done) if (!n.isConnected) done.delete(n);
});
const btn=document.getElementById('uiLangBtn'), inp=document.getElementById('uiLang');
function paintBtn(){ if (!btn) return; btn.querySelectorAll('[data-l]').forEach(s=>{ const on=s.dataset.l===lang; s.style.opacity=on?'1':'.4'; s.style.textDecoration=on?'underline':'none'; }); }
function setLang(l){
  l=l==='ru'?'ru':'en'; if (l===lang) { paintBtn(); return; }
  lang=l; document.documentElement.lang=l;
  if (l==='ru') { walk(document.body); obs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']}); }
  else { obs.disconnect(); restore(); }
  if (inp) inp.value=l;
  lsSet('mfk.uiLang.v1',l);
  paintBtn();
}
window.semI18n={setLang, t:s=>lang==='ru'?(tr(s)??s):s};
if (btn) btn.onclick=()=>setLang(lang==='ru'?'en':'ru');
if (inp) inp.addEventListener('change',()=>setLang(inp.value));
let saved='en'; try { saved=localStorage.getItem('mfk.uiLang.v1')||'en'; } catch(_) {}
paintBtn(); setTimeout(()=>setLang(inp&&inp.value!=='en'?inp.value:saved),30);
})();
