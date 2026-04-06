window.SILA_ARTICLES = window.SILA_ARTICLES || {};
window.SILA_ARTICLES['mankiw_2012'] = {
  meta: {
    key: 'mankiw_2012',
    title: 'Los diez principios de la economia',
    authors: 'N. Gregory Mankiw',
    year: 2012,
    category: 'Economia',
    weight: 'importante',
    journal: 'Principios de Economia, 6ta edicion, Cengage Learning',
    institution: 'Harvard University',
    fidelity: 99.0,
    cards: 32,
    concepts: 14,
    highlights: {
      authors: ['Adam Smith', 'Sam Peltzman', 'Ralph Nader', 'Austan Goolsbee', 'Gerald Ford', 'Barack Obama', 'Friedrich von Wieser', 'William Jevons', 'Carl Menger', 'Leon Walras', 'John Maynard Keynes', 'Milton Friedman'],
      terms: ['costo de oportunidad', 'cambios marginales', 'economia de mercado', 'mano invisible', 'falla del mercado', 'poder de mercado', 'derechos de propiedad', 'ciclo economico', 'escasez', 'incentivo', 'productividad', 'inflacion', 'equidad', 'eficiencia', 'externalidad', 'planificacion central'],
      key: ['La economia es el estudio de como la sociedad administra sus recursos que son escasos', 'El costo de oportunidad de una cosa es aquello a lo que renunciamos para conseguirla', 'Las personas responden a los incentivos, lo demas es irrelevante', 'Las familias y las empresas interactuan en los mercados como si fueran guiados por una mano invisible'],
      examples: ['linea aerea con asientos vacios', 'paradoja del agua y los diamantes', 'cinturones de seguridad y accidentes', 'hiperinflacion alemana 1921-1922']
    },
    downloads: {
      docx: 'downloads/articles/SILA_Mankiw_2012.docx',
      fuente: 'downloads/articles/Mankiw_2012_fuente.txt'
    }
  },

  sections: [
    /* ====== SECCION 0: INTRODUCCION ====== */
    {
      title: 'Introduccion',
      paragraphs: [
        {
          text: 'La palabra economía proviene del griego oikonomos, que significa "el que administra una casa". Al principio este origen podría parecer peculiar, pero de hecho, las casas y la economía tienen mucho en común.',
          title: 'Etimologia griega de la palabra economia',
          eq: '¿Por que Mankiw elige la analogia del hogar para introducir la economia?',
          anns: [
            {t:'oikonomos = el que administra una casa; raiz etimologica que conecta hogar y economia', c:'#FFEB3B', b:false},
            {t:'La analogia casa-economia anticipa el tema central: administracion de recursos escasos', c:'#81D4FA', b:true},
            {t:'En una empresa, el CEO cumple la funcion de oikonomos: administra recursos escasos (capital, talento, tiempo) entre proyectos que compiten', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'En una casa se deben tomar muchas decisiones: debe decidirse cuáles tareas serán realizadas por cada uno de sus miembros y qué recibirán a cambio. ¿Quién cocina? ¿Quién lava la ropa? ¿A quién le toca un postre extra en la cena? ¿Quién decide qué se verá en la televisión? En suma, en una casa se deben distribuir los recursos, que son escasos, entre los diferentes miembros según sus habilidades, esfuerzos y deseos.',
          title: 'Decisiones domesticas como modelo de asignacion de recursos',
          eq: '¿De que manera las decisiones cotidianas de un hogar reflejan problemas economicos fundamentales?',
          anns: [
            {t:'Distribuir recursos escasos segun habilidades, esfuerzos y deseos: nucleo del problema economico', c:'#FFEB3B', b:true},
            {t:'Las preguntas retoricas (¿quien cocina?, etc.) hacen tangible la abstraccion economica', c:'#C5E1A5', b:false},
            {t:'→ CONEXION: la asignacion por habilidades y esfuerzos anticipa el Principio 5 (especializacion via comercio)', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Al igual que una casa, la sociedad enfrenta numerosas decisiones. Una sociedad debe encontrar la manera de decidir qué trabajos deben realizarse y quién llevará a cabo estas tareas. Se necesitan personas que trabajen la tierra, otras que confeccionen ropa, otras que diseñen programas para computadora. En fin, una vez que se han asignado las diversas tareas a los individuos que las llevarán a cabo (así como la tierra, los edificios y las máquinas), deben designarse, de igual manera, los diferentes bienes y servicios que serán producidos. Debe decidirse quién come caviar y quién papas, quién maneja un Ferrari y quién toma el autobús.',
          title: 'De la casa a la sociedad: asignacion de tareas y bienes',
          eq: '¿Que diferencias de escala existen entre la asignacion de recursos en un hogar y en una sociedad?',
          anns: [
            {t:'Se escala la analogia del hogar a la sociedad: mismos problemas, mayor complejidad', c:'#81D4FA', b:false},
            {t:'Caviar vs papas, Ferrari vs autobus: la asignacion implica desigualdad distributiva', c:'#FFEB3B', b:true},
            {t:'En organizaciones intensivas en IA, la asignacion de GPUs entre equipos replica esta logica: ¿quien accede a computo escaso y quien espera?', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'La administración de los recursos de la sociedad es importante porque los recursos son escasos. Escasez, significa que la sociedad tiene recursos limitados y, por tanto, no puede producir todos los bienes y servicios que las personas desearían tener. De la misma manera que un miembro de la casa no puede tener todo lo que quiere, la sociedad no puede proporcionar a todos sus miembros el máximo nivel de vida al que cada uno aspira.',
          title: 'La escasez como fundamento del problema economico',
          eq: '¿Por que la escasez es condicion necesaria para que exista la economia como disciplina?',
          anns: [
            {t:'CONCEPTO CLAVE: Escasez = recursos limitados vs deseos ilimitados', c:'#FFEB3B', b:true},
            {t:'Sin escasez no habria necesidad de economizar ni de elegir entre alternativas', c:'#81D4FA', b:false},
            {t:'Definicion formal: la sociedad tiene recursos limitados y no puede producir todo lo deseado', c:'#C5E1A5', b:true}
          ]
        },
        {
          text: 'La economía es el estudio de cómo la sociedad administra sus recursos que son escasos. En la mayoría de las sociedades los recursos no son asignados por un dictador omnipotente, sino que se distribuyen por medio de las acciones conjuntas de millones de hogares y empresas. Es por esto que los economistas estudian la manera en que las personas toman sus decisiones, cuánto trabajan, qué compran, cuánto ahorran y en qué invierten sus ahorros. Los economistas también estudian la manera en que las personas se interrelacionan. Examinan, por ejemplo, cómo una multitud de compradores y vendedores de un bien determinado, deciden a qué precio se vende y en qué cantidad. Finalmente, los economistas también analizan las fuerzas y las tendencias que afectan a la economía en su conjunto, incluyendo el crecimiento del ingreso promedio, la porción de la población que no encuentra trabajo y la tasa a la que se incrementan los precios.',
          title: 'Definicion de economia y tres niveles de analisis',
          eq: '¿Cuales son los tres niveles de analisis que aborda la economia segun Mankiw?',
          anns: [
            {t:'DEFINICION CENTRAL: Economia = estudio de como la sociedad administra recursos escasos', c:'#FFEB3B', b:true},
            {t:'Tres niveles: (1) decisiones individuales, (2) interaccion entre personas, (3) economia en su conjunto', c:'#81D4FA', b:true},
            {t:'Rechazo implicito de planificacion central: los recursos se asignan por acciones descentralizadas', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'El estudio de la economía tiene múltiples facetas, pero se encuentra unificado por varias ideas fundamentales. En este capítulo estudiaremos los Diez principios de la economía y le pedimos a usted que no se preocupe si no entiende todos los principios de un solo golpe, o si éstos no le parecen totalmente convincentes. En los capítulos subsecuentes se analizarán estas ideas de un modo más profundo. Aquí se introducen los diez principios de la economía para ofrecer una visión panorámica del objeto de estudio. Este capítulo debe ser considerado como un avance de los fascinantes conocimientos que estudiaremos.',
          title: 'Proposito del capitulo: vision panoramica de 10 principios',
          eq: '¿Que funcion pedagogica cumple presentar los 10 principios antes de profundizar en cada uno?',
          anns: [
            {t:'Estrategia didactica: primero panorama general, luego profundizacion', c:'#C5E1A5', b:false},
            {t:'Los 10 principios son el marco unificador de toda la disciplina economica', c:'#FFEB3B', b:true},
            {t:'→ CONEXION: esta estructura deductiva (principios generales → aplicaciones) es la misma logica axiomatica de la teoria neoclasica', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Una economía no tiene nada de misterio. Independientemente de que nos refiramos a la economía de Los Ángeles, a la de Estados Unidos o a la del mundo, la economía es solamente un grupo de personas interactuando en su vida diaria. El comportamiento de una economía refleja el comportamiento de sus individuos, y es por esto que iniciamos el estudio de la economía con cuatro principios que regulan a los individuos al tomar decisiones.',
          title: 'La economia como interaccion cotidiana de individuos',
          eq: '¿Por que es significativo que Mankiw defina la economia como personas interactuando en su vida diaria?',
          anns: [
            {t:'Individualismo metodologico: la economia agregada refleja el comportamiento individual', c:'#81D4FA', b:true},
            {t:'Se desmitifica la economia: no es algo abstracto, sino personas tomando decisiones', c:'#C5E1A5', b:false},
            {t:'DISTINCION: el individualismo metodologico NO niega fenomenos colectivos; solo afirma que deben explicarse desde decisiones individuales', c:'#C00000', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿De donde proviene etimologicamente la palabra economia?',
          '¿Cual es la definicion de economia segun Mankiw?',
          '¿Que significa escasez en terminos economicos?',
          '¿Cuales son los tres niveles de analisis economico que introduce este capitulo?'
        ],
        a: [
          'Del griego oikonomos, que significa el que administra una casa.',
          'La economia es el estudio de como la sociedad administra sus recursos que son escasos.',
          'Escasez significa que la sociedad tiene recursos limitados y no puede producir todos los bienes y servicios que las personas desean.',
          'Decisiones individuales, interaccion entre personas y funcionamiento de la economia en su conjunto.'
        ]
      }
    },

    /* ====== SECCION 1: PRINCIPIO 1 ====== */
    {
      title: 'Principio 1: Las personas enfrentan disyuntivas',
      paragraphs: [
        {
          text: 'Quizá haya escuchado el dicho que asegura: "No se puede hablar y silbar al mismo tiempo". Este dicho es muy cierto y resume la primera lección sobre toma de decisiones, ya que para obtener lo que queremos, en general tenemos que renunciar a algo que también nos gusta. Tomar decisiones significa elegir entre dos objetivos.',
          title: 'Tomar decisiones implica renunciar a alternativas',
          eq: '¿Por que toda decision implica necesariamente una renuncia?',
          anns: [
            {t:'Principio fundamental: tomar decisiones = elegir entre dos objetivos, renunciar a uno', c:'#FFEB3B', b:true},
            {t:'La metafora de hablar y silbar hace tangible el concepto de disyuntiva', c:'#C5E1A5', b:false},
            {t:'→ REAPARECE EN: Principio 2 profundiza la renuncia como costo de oportunidad; aqui solo se establece que existe la disyuntiva', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Pensemos en un estudiante que debe decidir cómo distribuir su recurso más valioso, es decir, su tiempo. El estudiante puede pasar todo su tiempo estudiando economía, psicología o dividiéndolo entre estas dos materias. Por cada hora que el estudiante destine a estudiar una materia, automáticamente dejará de estudiar la otra materia durante ese tiempo. Por cada hora que pase estudiando, automáticamente dejará de dedicar dicha hora a tomar una siesta, pasear en bicicleta, ver la televisión o trabajar medio tiempo para así tener algo de dinero extra.',
          title: 'El tiempo como recurso escaso del estudiante',
          eq: '¿Por que el tiempo es considerado el recurso mas valioso para un estudiante?',
          anns: [
            {t:'El tiempo es el recurso mas escaso: cada hora asignada a X es una hora que no se dedica a Y', c:'#FFEB3B', b:true},
            {t:'Ejemplo concreto de disyuntiva individual: estudiar economia vs psicologia vs ocio vs trabajo', c:'#C5E1A5', b:false},
            {t:'Un doctorando enfrenta la misma disyuntiva: cada hora dedicada a revision de literatura es una hora menos para recoleccion de datos o docencia', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'Ahora piense en los padres que deciden cómo gastar el ingreso familiar. Pueden comprar ropa, comida o salir de vacaciones; pueden también ahorrar una parte de su ingreso para cuando se jubilen; o bien, para pagar la educación de sus hijos. Cuando los padres deciden gastar un dólar en uno de estos bienes, automáticamente tienen un dólar menos para gastar en otra cosa.',
          title: 'Disyuntiva familiar: asignar ingreso limitado entre necesidades',
          eq: '¿Como se manifiesta la disyuntiva a nivel familiar?',
          anns: [
            {t:'El ingreso familiar es finito: gastar un dolar en algo es renunciar a gastarlo en otra cosa', c:'#FFEB3B', b:false},
            {t:'Disyuntiva intertemporal: consumo presente (ropa, vacaciones) vs ahorro futuro (jubilacion, educacion)', c:'#81D4FA', b:true},
            {t:'IMPLICACION: las empresas enfrentan la misma disyuntiva intertemporal al decidir entre dividendos hoy o inversion en I+D para mañana', c:'#C55A11', b:false}
          ]
        },
        {
          text: 'Cuando las personas se agrupan en sociedades enfrentan diferentes disyuntivas. La disyuntiva más común es entre "pan y armas". Entre más gaste la sociedad en defensa nacional (armas), menos dinero tendrá para gastar en bienes de consumo (pan) y así mejorar el nivel de vida de la sociedad en su conjunto. Asimismo, en las sociedades modernas también es importante la disyuntiva entre un ambiente limpio y un alto nivel de ingreso. Las leyes necesarias para hacer que las empresas contaminen menos provocan que los costos de producción de los bienes y servicios aumenten y, debido a estos costos más altos, las empresas ganan menos, o pagan salarios más bajos o venden los bienes a precios más altos, o crean una combinación de estas variables. Así, y aunque las leyes para contaminar menos tienen como resultado un ambiente más limpio y mejoran la salud, su costo es la reducción del ingreso de los propietarios de las empresas, los trabajadores y los consumidores.',
          title: 'Disyuntivas sociales: pan vs armas, ambiente vs ingreso',
          eq: '¿Por que las regulaciones ambientales ilustran una disyuntiva social inevitable?',
          anns: [
            {t:'Pan vs armas: disyuntiva clasica entre gasto militar y bienestar social', c:'#FFEB3B', b:true},
            {t:'Ambiente limpio vs ingreso alto: las regulaciones ambientales aumentan costos de produccion', c:'#81D4FA', b:true},
            {t:'El costo de contaminar menos se distribuye entre propietarios, trabajadores y consumidores', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'Otra disyuntiva que la sociedad enfrenta es entre la eficiencia y la equidad. La eficiencia significa que la sociedad extrae el máximo beneficio de sus recursos escasos. La equidad significa que la sociedad distribuye igualitariamente esos beneficios entre sus miembros. En otras palabras, piense en los recursos de la economía como un pastel que debe repartirse. La eficiencia sería el tamaño del pastel y la equidad la manera en cómo se reparte entre los diferentes individuos.',
          title: 'Eficiencia vs equidad: tamaño del pastel vs su distribucion',
          eq: '¿Pueden una sociedad lograr maxima eficiencia y maxima equidad simultaneamente?',
          anns: [
            {t:'CONCEPTO: Eficiencia = extraer maximo beneficio de recursos escasos (tamaño del pastel)', c:'#FFEB3B', b:true},
            {t:'CONCEPTO: Equidad = distribucion igualitaria de beneficios (como se reparte el pastel)', c:'#FFEB3B', b:true},
            {t:'Metafora del pastel: eficiencia = tamaño, equidad = reparto', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'En el momento en que las políticas públicas se diseñan, estos dos objetivos entran en conflicto. Piense, por ejemplo, en las medidas destinadas a conseguir una distribución más equitativa del bienestar económico. Algunas de ellas, como la asistencia social o el seguro de desempleo, tratan de ayudar a los más necesitados. Otras, como el impuesto sobre la renta que pagan las personas, están destinadas a hacer que los individuos que tienen mayor éxito económico contribuyan en mayor medida al financiamiento del gobierno. Aun cuando estas medidas aumentan la equidad entre la sociedad, también reducen su eficiencia. Cuando el gobierno redistribuye el ingreso de los ricos hacia los pobres, reduce también la recompensa al trabajo duro y, como resultado, las personas tienden a trabajar menos y a producir menos bienes y servicios; en otras palabras, cuando el gobierno trata de repartir el pastel en porciones iguales, éste se hace más pequeño.',
          title: 'Politicas redistributivas reducen incentivos y eficiencia',
          eq: '¿Por que la redistribucion del ingreso puede reducir el tamaño total del pastel economico?',
          anns: [
            {t:'Tension central: redistribuir ingreso reduce recompensa al trabajo duro, disminuye produccion', c:'#FFEB3B', b:true},
            {t:'Cuando el gobierno iguala las porciones del pastel, este se hace mas pequeño', c:'#81D4FA', b:true},
            {t:'Ejemplos de politicas redistributivas: asistencia social, seguro de desempleo, impuesto sobre la renta', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'El hecho de reconocer que las personas enfrentan disyuntivas no indica por sí solo qué decisiones tomarán o deberían tomar. Un estudiante no deja de estudiar psicología sólo porque eso le permitirá tener más tiempo para estudiar economía. Del mismo modo, la sociedad no deja de proteger el ambiente sólo porque las regulaciones ambientales reducen nuestro nivel de vida material. Asimismo, la sociedad no debe dejar de ayudar a los pobres sólo porque esto distorsiona los incentivos del trabajo. No obstante, es importante reconocer las disyuntivas que se enfrentan en la vida, porque muy probablemente los individuos sólo tomarán decisiones adecuadas si comprenden cuáles son las opciones que tienen.',
          title: 'Reconocer disyuntivas no dicta decisiones pero las mejora',
          eq: '¿Cual es el valor practico de reconocer las disyuntivas aunque no determine que elegir?',
          anns: [
            {t:'Reconocer disyuntivas ≠ prescribir decisiones; pero es condicion necesaria para decidir bien', c:'#FFEB3B', b:true},
            {t:'Solo se toman decisiones adecuadas cuando se comprenden todas las opciones disponibles', c:'#81D4FA', b:false},
            {t:'IMPLICACION: en gestion organizacional, el analisis de disyuntivas es previo a la planificacion estrategica; sin el no hay estrategia racional', c:'#C55A11', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que significa enfrentar disyuntivas segun el Principio 1?',
          '¿Cual es la disyuntiva clasica a nivel de la sociedad?',
          '¿Cual es la diferencia entre eficiencia y equidad?',
          '¿Por que la redistribucion puede reducir la eficiencia?'
        ],
        a: [
          'Significa que para obtener algo que queremos debemos renunciar a algo que tambien nos gusta; tomar decisiones es elegir entre dos objetivos.',
          'La disyuntiva entre pan y armas: mas gasto en defensa nacional implica menos recursos para bienes de consumo.',
          'Eficiencia es extraer el maximo beneficio de los recursos escasos (tamaño del pastel); equidad es distribuir igualitariamente esos beneficios (como se reparte).',
          'Porque al redistribuir el ingreso de ricos a pobres, se reduce la recompensa al trabajo duro, las personas trabajan y producen menos, y el pastel se hace mas pequeño.'
        ]
      }
    },

    /* ====== SECCION 2: PRINCIPIO 2 ====== */
    {
      title: 'Principio 2: El costo de una cosa es aquello a lo que se renuncia para obtenerla',
      paragraphs: [
        {
          text: 'Debido a que al tomar decisiones los individuos enfrentan disyuntivas, es necesario comparar los costos y los beneficios de los diferentes cursos de acción que pueden tomar. Sin embargo, en muchos casos el costo de una acción no es tan evidente como podría parecer al principio.',
          title: 'El costo real no siempre es evidente a primera vista',
          eq: '¿Por que los costos reales de una decision suelen subestimarse?',
          anns: [
            {t:'Transicion logica: si hay disyuntivas (P1), entonces hay que comparar costos y beneficios', c:'#81D4FA', b:false},
            {t:'Advertencia: el costo de una accion no es tan evidente como parece', c:'#FFEB3B', b:true},
            {t:'↩ RETOMA: P1 establece que hay disyuntiva; P2 operacionaliza la disyuntiva midiendo lo que se sacrifica (costo de oportunidad)', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Considere, por ejemplo, la decisión de asistir a la universidad. El beneficio será el enriquecimiento intelectual y tener mejores oportunidades de trabajo, pero ¿cuáles serán los costos? Para responder a esta pregunta quizá estemos tentados a incluir cuestiones como el dinero que se gastará, los libros, el alojamiento y la manutención. Sin embargo, este total no representa realmente aquello a lo que renunciamos cuando decidimos estudiar un año de universidad.',
          title: 'Costos aparentes vs costos reales de la universidad',
          eq: '¿Por que sumar gastos directos no captura el costo real de ir a la universidad?',
          anns: [
            {t:'El calculo ingenuo incluye gastos visibles (libros, alojamiento) pero omite el costo de oportunidad', c:'#FFEB3B', b:true},
            {t:'Beneficios de la universidad: enriquecimiento intelectual + mejores oportunidades de trabajo', c:'#C5E1A5', b:false},
            {t:'Analogamente, una empresa que invierte en capacitacion en IA subestima el costo si solo mide la matricula y no el tiempo productivo perdido de sus empleados', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'Hay dos problemas con este cálculo: el primero es que incluye cosas que no son realmente los costos de estudiar en la universidad, ya que aun cuando usted abandonara los estudios, de cualquier manera necesitaría gastar en alojamiento y comida, los cuales son costos de ir a la universidad sólo en la medida en que son más caros en la universidad que en otros lugares. Segundo, este cálculo ignora el costo más alto de asistir a la universidad: el tiempo. Cuando uno decide pasar un año asistiendo a clases, leyendo libros de texto y escribiendo trabajos, ese año no puede dedicarse a trabajar. Para la mayoría de los estudiantes el costo más alto de asistir a la universidad es dejar de ganar el dinero que generarían si trabajaran.',
          title: 'El tiempo perdido es el mayor costo de asistir a la universidad',
          eq: '¿Por que el tiempo es el costo mas alto de estudiar en la universidad?',
          anns: [
            {t:'Error 1: incluir gastos que se tendrian de todos modos (alojamiento, comida)', c:'#FFEB3B', b:false},
            {t:'Error 2: ignorar el costo mas alto: el TIEMPO y el salario que se deja de percibir', c:'#FFEB3B', b:true},
            {t:'El costo de oportunidad incluye costos NO monetarios (tiempo). Confundirlo con gasto directo lleva a decisiones erroneas.', c:'#FF8A65', b:true}
          ]
        },
        {
          text: 'El costo de oportunidad de una cosa es aquello a lo que renunciamos para conseguirla. Cuando tomamos una decisión, como la de estudiar en la universidad, debemos estar conscientes de los costos de oportunidad que acompañan cada una de nuestras posibles opciones. Por ejemplo, los deportistas colegiales que tienen la posibilidad de ganar millones si abandonan los estudios y se dedican profesionalmente al deporte, por lo general están muy conscientes de que para ellos el costo de oportunidad de estudiar en la universidad es muy alto. No es de extrañar que a menudo lleguen a la conclusión de que el beneficio de asistir a la universidad no vale la pena el costo.',
          title: 'Definicion de costo de oportunidad y ejemplo deportivo',
          eq: '¿Por que los deportistas de elite son un buen ejemplo para entender el costo de oportunidad?',
          anns: [
            {t:'DEFINICION: Costo de oportunidad = aquello a lo que renunciamos para conseguir algo', c:'#FFEB3B', b:true},
            {t:'Para deportistas colegiales con potencial profesional, el costo de oportunidad de la universidad es altisimo (millones)', c:'#81D4FA', b:true},
            {t:'IMPLICACION: el costo de oportunidad explica por que ingenieros de IA con alta empleabilidad abandonan doctorados; el salario sacrificado supera el valor del grado', c:'#C55A11', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que es el costo de oportunidad?',
          '¿Cual es el costo mas alto de asistir a la universidad para la mayoria de los estudiantes?',
          '¿Por que los deportistas colegiales suelen abandonar la universidad?'
        ],
        a: [
          'Es aquello a lo que renunciamos para conseguir algo.',
          'Dejar de ganar el dinero que generarian si trabajaran, es decir, el valor del tiempo.',
          'Porque su costo de oportunidad es muy alto: podrian ganar millones dedicandose profesionalmente al deporte.'
        ]
      }
    },

    /* ====== SECCION 3: PRINCIPIO 3 ====== */
    {
      title: 'Principio 3: Las personas racionales piensan en terminos marginales',
      paragraphs: [
        {
          text: 'Los economistas generalmente suponen que los individuos son racionales. Una persona racional, dadas las oportunidades, sistemática y deliberadamente hace todo lo posible por lograr sus objetivos. Al estudiar economía, usted encontrará empresas que deciden cuántos trabajadores contratarán y cuánto producirán y venderán con objeto de maximizar sus beneficios. También encontrará personas que deciden cuánto tiempo deben trabajar y qué bienes y servicios deben adquirir con su ingreso, con el fin de lograr la mayor satisfacción posible.',
          title: 'Supuesto de racionalidad: maximizar objetivos deliberadamente',
          eq: '¿Que implica el supuesto de racionalidad para el analisis economico?',
          anns: [
            {t:'CONCEPTO: Persona racional = hace todo lo posible sistematica y deliberadamente por lograr sus objetivos', c:'#FFEB3B', b:true},
            {t:'Empresas maximizan beneficios, personas maximizan satisfaccion: logica de optimizacion', c:'#81D4FA', b:false},
            {t:'DISTINCION: la economia conductual (Kahneman, Thaler) cuestiona este supuesto; las personas usan heuristicos y tienen sesgos sistematicos', c:'#C00000', b:false}
          ]
        },
        {
          text: 'Las personas racionales saben que las decisiones en la vida raras veces se traducen en elegir entre lo blanco y lo negro y, generalmente, existen muchos matices de grises. A la hora de la cena, por ejemplo, no tenemos que elegir entre ayunar o comer en exceso, más bien la decisión consiste en si debemos o no comer más puré de papa. Asimismo, cuando estamos en época de exámenes, no necesitamos elegir entre no estudiar o estudiar las 24 horas del día, sino entre dedicar una hora más al estudio o a ver televisión. Los economistas utilizan el término cambio marginal para describir los pequeños ajustes que realizamos a un plan que ya existía. Es importante resaltar que aquí margen significa "borde", y por eso los cambios marginales son aquellos que realizamos en el borde de lo que hacemos. Las personas racionales a menudo toman decisiones comparando los beneficios marginales y los costos marginales.',
          title: 'Cambios marginales: ajustes pequeños en el borde de un plan',
          eq: '¿Por que las decisiones reales son marginales y no de todo o nada?',
          anns: [
            {t:'CONCEPTO: Cambios marginales = pequeños ajustes adicionales a un plan existente', c:'#FFEB3B', b:true},
            {t:'Margen = borde; las decisiones se toman en el margen comparando beneficio marginal vs costo marginal', c:'#81D4FA', b:true},
            {t:'Ejemplos cotidianos: comer un plato mas, estudiar una hora mas; no decisiones binarias', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'Piense ahora en el caso de una línea aérea que tiene que decidir cuánto le cobrará a los pasajeros para que vuelen sin hacer reservación. Suponga que volar por todo el país un avión de 200 plazas le cuesta a la empresa $100 000. En este caso, el costo promedio por asiento sería $100 000/200, es decir $500. Esto quizá nos lleve a concluir que la línea aérea no debe vender ningún boleto en menos de $500. Sin embargo, en la realidad, la línea aérea puede obtener más beneficios pensando en términos marginales. Imagine por un momento que un avión está a punto de despegar con 10 asientos vacíos y que un pasajero sin reservación está esperando en la puerta de embarque dispuesto a pagar $300 por su boleto. ¿Debería venderle el boleto la línea aérea? Por supuesto que sí. El avión tiene asientos vacíos y el costo de llevar a un pasajero más es casi nulo. De este modo, y aunque el costo promedio de llevar a un pasajero sea $500, en realidad el costo marginal de llevar a un pasajero más será la bebida y las botanas que este pasajero consuma. En la medida en que el pasajero que quiere volar en el último minuto pague más que el costo marginal, será rentable venderle el boleto.',
          title: 'Ejemplo de la linea aerea: costo promedio vs costo marginal',
          eq: '¿Por que la linea aerea debe vender el boleto a $300 si el costo promedio es $500?',
          anns: [
            {t:'EJEMPLO CLASICO: costo promedio ($500) vs costo marginal (casi nulo) de un asiento vacio', c:'#FFEB3B', b:true},
            {t:'Si beneficio marginal ($300) > costo marginal (bebida y botanas), conviene vender', c:'#81D4FA', b:true},
            {t:'Pensar en promedios puede llevar a perder oportunidades rentables', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'La toma de decisiones marginales ayuda a explicar algunos fenómenos económicos que, de lo contrario, sería difícil entender. Formulemos una pregunta clásica: ¿por qué el agua es barata y los diamantes son caros? Los seres humanos necesitan el agua para sobrevivir, mientras que los diamantes son innecesarios; pero por alguna razón las personas están dispuestas a pagar mucho más por un diamante que por un vaso de agua. La razón de esta conducta se encuentra en el hecho de que la disposición de una persona a pagar por un bien se basa en el beneficio marginal que generaría con una unidad más de ese bien. Así, el beneficio marginal depende del número de unidades que posea esa persona. Aun cuando el agua es esencial, el beneficio marginal de tener un vaso más es casi nulo debido a que el agua es abundante. En cambio, aun cuando nadie necesita diamantes para sobrevivir, el hecho de que sean tan escasos provoca que las personas piensen que el beneficio marginal de tener un diamante extra es más grande.',
          title: 'Paradoja del agua y los diamantes explicada por el margen',
          eq: '¿Como resuelve el pensamiento marginal la paradoja del agua y los diamantes?',
          anns: [
            {t:'PARADOJA CLASICA: agua (esencial pero barata) vs diamantes (innecesarios pero caros)', c:'#FFEB3B', b:true},
            {t:'Resolucion: valor marginal, no valor total. El agua abundante tiene bajo beneficio marginal por unidad adicional', c:'#81D4FA', b:true},
            {t:'La escasez del diamante eleva su beneficio marginal, aunque su valor total para la supervivencia sea cero', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'Un tomador de decisiones racional emprende una acción si y sólo si el beneficio marginal de esta acción es mayor al costo marginal. Este principio explica por qué las líneas aéreas están dispuestas a vender un boleto a un precio inferior al costo promedio y por qué las personas lo están a pagar más por los diamantes que por el agua. Puede tomar algún tiempo acostumbrarse a la lógica del razonamiento marginal, pero el estudio de la economía provee múltiples oportunidades para poner este razonamiento en práctica.',
          title: 'Regla de oro: actuar si beneficio marginal supera costo marginal',
          eq: '¿Cual es la regla de decision que resume el pensamiento marginal?',
          anns: [
            {t:'REGLA DE ORO: emprender accion si y solo si beneficio marginal > costo marginal', c:'#FFEB3B', b:true},
            {t:'Unifica los ejemplos: linea aerea (vender a $300) y agua/diamantes (valor marginal vs total)', c:'#81D4FA', b:false},
            {t:'En gestion, esta regla se aplica al decidir si contratar un empleado adicional: si su productividad marginal supera su salario, conviene contratarlo', c:'#1A5C38', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que son los cambios marginales?',
          '¿Por que la linea aerea deberia vender un boleto a $300 si el costo promedio es $500?',
          '¿Como se resuelve la paradoja del agua y los diamantes?',
          '¿Cual es la regla de decision racional segun el principio 3?'
        ],
        a: [
          'Son pequeños ajustes adicionales que se hacen a un plan de accion que ya existia.',
          'Porque el costo marginal de un pasajero adicional es casi nulo (solo bebida y botanas), y $300 supera ese costo marginal.',
          'Con pensamiento marginal: el agua es abundante, su beneficio marginal por unidad adicional es casi nulo; los diamantes son escasos, su beneficio marginal es alto.',
          'Un tomador de decisiones racional emprende una accion si y solo si el beneficio marginal es mayor al costo marginal.'
        ]
      }
    },

    /* ====== SECCION 4: PRINCIPIO 4 ====== */
    {
      title: 'Principio 4: Las personas responden a los incentivos',
      paragraphs: [
        {
          text: 'Un incentivo es algo que induce a las personas a actuar y puede ser una recompensa o un castigo. Las personas racionales responden a los incentivos debido a que toman sus decisiones comparando los costos y los beneficios. Usted verá cómo los incentivos desempeñan un rol primordial en el estudio de la economía. Un economista llegó incluso a decir que la economía puede resumirse en la siguiente frase: "Las personas responden a los incentivos, lo demás es irrelevante".',
          title: 'Incentivos como motor de la conducta economica',
          eq: '¿Por que se afirma que toda la economia se resume en que las personas responden a incentivos?',
          anns: [
            {t:'CONCEPTO: Incentivo = algo que induce a actuar (recompensa o castigo)', c:'#FFEB3B', b:true},
            {t:'Frase iconica: "Las personas responden a los incentivos, lo demas es irrelevante"', c:'#81D4FA', b:true},
            {t:'→ CONEXION: en teoria de la agencia (Jensen & Meckling), el diseño de incentivos es el mecanismo central para alinear intereses entre principal y agente', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Los incentivos son fundamentales cuando se analiza cómo funcionan los mercados. Por ejemplo, cuando el precio de las manzanas aumenta, las personas deciden consumir menos manzanas; a su vez, el productor decide contratar a más personas, con la finalidad de cultivar más manzanas. En suma, un precio de mercado más alto incentiva a los compradores a consumir menos y a los productores a producir más. Como después se verá, la influencia de los precios en el comportamiento de los consumidores y los productores es de vital importancia para determinar cómo distribuye una economía de mercado los recursos escasos.',
          title: 'Los precios como señales que incentivan oferta y demanda',
          eq: '¿Como funcionan los precios como mecanismo de incentivos en los mercados?',
          anns: [
            {t:'Precio alto: consumidores compran menos, productores producen mas. Precio como señal de incentivo dual.', c:'#FFEB3B', b:true},
            {t:'Los precios son el mecanismo por el cual la economia de mercado asigna recursos escasos', c:'#81D4FA', b:false},
            {t:'Cuando el precio de las GPUs sube, las startups de IA reducen entrenamiento y los fabricantes invierten en mas capacidad: la logica de oferta-demanda opera igual', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'Las autoridades no deben olvidar los incentivos, pues muchas de las medidas que toman alteran los costos o los beneficios que enfrentan los individuos y, por tanto, su conducta. Piense, por ejemplo, en un impuesto a la gasolina, esto motivará a las personas a usar automóviles compactos y eficientes. De hecho, ésta es una de las razones por las que en Europa se utilizan automóviles compactos, ya que en ese continente los impuestos a la gasolina son más altos que en Estados Unidos, donde las personas usan vehículos más grandes. El impuesto a la gasolina también incentiva los viajes en automóvil compartido, el transporte público y el tratar de vivir más cerca del lugar de trabajo. Si este impuesto fuera más alto, las personas tenderían a usar más automóviles híbridos, y si fuera más alto aún, se utilizarían automóviles eléctricos.',
          title: 'Impuestos a la gasolina alteran conducta de transporte',
          eq: '¿Como demuestran los impuestos a la gasolina que las politicas publicas funcionan a traves de incentivos?',
          anns: [
            {t:'Las politicas publicas alteran costos y beneficios, modificando la conducta de los individuos', c:'#FFEB3B', b:true},
            {t:'Europa vs EE.UU.: impuestos altos a gasolina -> autos compactos; impuestos bajos -> vehiculos grandes', c:'#81D4FA', b:true},
            {t:'Cascada de incentivos: impuesto gasolina -> autos compactos -> hibridos -> electricos', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'Cuando las autoridades no consideran cómo sus medidas repercuten en los incentivos, pueden provocar resultados que no deseaban. Piense en la legislación sobre seguridad vial en Estados Unidos. Hoy día todos los automóviles tienen cinturones de seguridad, pero en la década de 1950 esto no era así. En la década de 1960 el libro de Ralph Nader No estás seguro a ninguna velocidad (Unsafe at any speed) despertó en la opinión pública una gran preocupación respecto a la seguridad en los automóviles. El Congreso de Estados Unidos respondió emitiendo leyes que obligaban a las empresas a incluir los cinturones de seguridad en todos los automóviles.',
          title: 'Ralph Nader y la legislacion sobre cinturones de seguridad',
          eq: '¿Que motivo la legislacion sobre cinturones de seguridad en EE.UU.?',
          anns: [
            {t:'Cuando las autoridades ignoran los incentivos, sus medidas pueden tener efectos no deseados', c:'#FFEB3B', b:true},
            {t:'Ralph Nader y su libro Unsafe at any speed impulsaron la legislacion de cinturones de seguridad', c:'#C5E1A5', b:false},
            {t:'→ REAPARECE EN: Principio 7 desarrolla formalmente cuando la intervencion del gobierno se justifica y cuando genera mas daño que beneficio', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: '¿Cómo afecta a la seguridad de los automóviles una ley sobre los cinturones de seguridad? El efecto directo es evidente, ya que cuando una persona usa dicho cinturón aumenta la probabilidad de supervivencia ante un accidente grave. Pero la historia no termina aquí, debido a que la ley también afecta el comportamiento al alterar los incentivos. El comportamiento relevante es la velocidad y el cuidado con que los automovilistas conducen. Conducir lento y con cuidado es costoso porque requiere de mayor tiempo y energía. Así, al decidir qué tan cuidadosamente conducen, los individuos racionales comparan, quizá de modo inconsciente, el beneficio marginal que existe entre conducir con mayor seguridad y el costo marginal. De este modo, las personas conducen más lento y con más cuidado cuando el beneficio del aumento de la seguridad es alto. No sorprende, por tanto, que se conduzca más lento y con más cuidado cuando las carreteras están mojadas que cuando están secas.',
          title: 'El cinturon altera incentivos: efecto sobre la conduccion',
          eq: '¿Como el cinturon de seguridad modifica el calculo costo-beneficio del conductor?',
          anns: [
            {t:'Efecto directo: mayor supervivencia en accidentes. Efecto indirecto: menos cuidado al conducir', c:'#FFEB3B', b:true},
            {t:'Conductores racionales comparan beneficio marginal de seguridad vs costo marginal de ir lento', c:'#81D4FA', b:true},
            {t:'↩ RETOMA: aplica el pensamiento marginal del P3; el conductor ajusta velocidad en el margen segun el nuevo calculo costo-beneficio', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Considere ahora cómo la ley sobre los cinturones de seguridad altera el cálculo costo-beneficio de los conductores. El cinturón de seguridad reduce el costo de los accidentes, ya que disminuye tanto la probabilidad de sufrir una lesión, como la de perecer. En otras palabras, reduce los beneficios de conducir lento y con cuidado. La respuesta de las personas ante los cinturones de seguridad es la misma que ante una mejora en las condiciones de las carreteras: conducir más rápido y con menos cuidado. Así, el resultado de dicha ley es un incremento en el número de accidentes. El hecho de que se conduzca con menor cuidado repercute negativamente en los peatones, quienes enfrentan la posibilidad de más accidentes pero, al contrario de lo que sucede con los conductores, no se benefician de la protección adicional que implica usar el cinturón de seguridad.',
          title: 'Cinturones de seguridad aumentan accidentes para peatones',
          eq: '¿Por que los cinturones de seguridad pueden perjudicar a los peatones?',
          anns: [
            {t:'Cinturon reduce costo personal de accidente -> conductores manejan mas rapido y descuidado', c:'#FFEB3B', b:true},
            {t:'Externalidad negativa: peatones sufren mas accidentes sin beneficiarse del cinturon', c:'#81D4FA', b:true},
            {t:'Ejemplo clasico de consecuencias no intencionadas de una politica publica', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'En un principio, la discusión entre los incentivos y los cinturones de seguridad quizá parezca pura especulación, pero lo cierto es que un estudio clásico del economista Sam Peltzman, publicado en 1975, muestra que las leyes sobre la seguridad en los automóviles produjeron muchos de los efectos señalados antes. Según la evidencia recabada por Peltzman, las leyes dieron como resultado menos muertes por accidente, pero también provocaron más accidentes. El estudio concluyó que el resultado neto es una pequeña variación en el número de muertes entre los automovilistas y un aumento en el número de muertes entre los peatones.',
          title: 'Estudio de Peltzman (1975): evidencia empirica de incentivos alterados',
          eq: '¿Que demostro empiricamente el estudio de Sam Peltzman sobre cinturones de seguridad?',
          anns: [
            {t:'Peltzman (1975): leyes de seguridad -> menos muertes por accidente PERO mas accidentes totales', c:'#FFEB3B', b:true},
            {t:'Resultado neto: poca variacion en muertes de automovilistas, aumento en muertes de peatones', c:'#81D4FA', b:true},
            {t:'IMPLICACION: el "efecto Peltzman" es un caso de riesgo moral; analogamente, los seguros de deposito bancario pueden incentivar inversiones mas riesgosas', c:'#C55A11', b:false}
          ]
        },
        {
          text: 'El análisis de Peltzman es un ejemplo poco convencional que muestra cómo es que los individuos responden a los incentivos. Así, al analizar cualquier medida debemos considerar no sólo los efectos directos, sino también los indirectos que en ocasiones son menos obvios y repercuten sobre los incentivos, ya que si la medida altera los incentivos, modificará también la conducta de los individuos.',
          title: 'Leccion: considerar efectos directos e indirectos de las politicas',
          eq: '¿Por que es insuficiente analizar solo los efectos directos de una politica publica?',
          anns: [
            {t:'Regla de analisis: toda medida tiene efectos directos e indirectos; los indirectos alteran incentivos y conducta', c:'#FFEB3B', b:true},
            {t:'El efecto Peltzman es paradigma de consecuencias no previstas en politicas publicas', c:'#81D4FA', b:false},
            {t:'En regulacion de IA, las normas de seguridad pueden generar el mismo efecto: mayor confianza percibida lleva a usos mas arriesgados de la tecnologia', c:'#1A5C38', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que es un incentivo?',
          '¿Como afectan los cinturones de seguridad la conducta de los conductores?',
          '¿Que demostro el estudio de Sam Peltzman en 1975?',
          '¿Por que las politicas publicas deben considerar los efectos indirectos sobre los incentivos?'
        ],
        a: [
          'Es algo que induce a las personas a actuar; puede ser una recompensa o un castigo.',
          'Reducen el costo personal de los accidentes, lo que lleva a conducir mas rapido y con menos cuidado.',
          'Que las leyes de seguridad vial produjeron menos muertes por accidente pero mas accidentes totales, con un aumento de muertes entre peatones.',
          'Porque si una medida altera los incentivos, modificara la conducta de los individuos de formas no siempre previstas.'
        ]
      }
    },

    /* ====== SECCION 5: PRINCIPIO 5 ====== */
    {
      title: 'Principio 5: El comercio puede mejorar el bienestar de todos',
      paragraphs: [
        {
          text: 'Probablemente usted haya escuchado en las noticias que en la economía mundial Japón es el competidor de Estados Unidos. Esto de alguna manera es cierto porque las empresas estadounidenses y las japonesas producen bienes parecidos; Ford y Toyota compiten por los mismos clientes en el mercado automotriz, y Apple y Sony lo hacen en el mercado de reproductores de música digital.',
          title: 'Competencia entre naciones: percepcion comun de rivalidad',
          eq: '¿Por que la narrativa de competencia entre paises es una simplificacion engañosa?',
          anns: [
            {t:'Percepcion popular: comercio internacional = competencia donde uno gana y otro pierde', c:'#C5E1A5', b:false},
            {t:'Ejemplos concretos: Ford vs Toyota, Apple vs Sony en mercados globales', c:'#81D4FA', b:false},
            {t:'DISTINCION: la narrativa de rivalidad entre naciones es mercantilismo (siglo XVII); la economia moderna muestra que el comercio es de suma positiva', c:'#C00000', b:false}
          ]
        },
        {
          text: 'Sin embargo, es fácil dejarse engañar cuando se piensa en la competencia entre países. El comercio entre dos naciones no es como una competencia deportiva en la que uno gana y otro pierde. Por el contrario, el comercio entre dos países puede mejorar el bienestar de las naciones participantes.',
          title: 'El comercio internacional no es juego de suma cero',
          eq: '¿Que distingue al comercio de una competencia deportiva?',
          anns: [
            {t:'IDEA CLAVE: el comercio NO es suma cero; ambas partes pueden ganar', c:'#FFEB3B', b:true},
            {t:'Refutacion de la falacia mercantilista: el comercio beneficia a todas las naciones participantes', c:'#81D4FA', b:false},
            {t:'→ CONEXION: David Ricardo (ventaja comparativa) formalizara esta idea: incluso quien es menos eficiente en todo gana al especializarse en lo relativamente mejor', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Para entender por qué sucede esto, piense en cómo es que el comercio afecta a las familias. Cuando un miembro de nuestra familia busca trabajo está compitiendo con miembros de otras familias que también lo buscan; del mismo modo las familias compiten entre sí cuando van de compras, ya que cada una quiere comprar las mejores mercancías a los mejores precios. Por tanto, podemos decir que en la economía cada familia compite con las demás.',
          title: 'Competencia entre familias en el mercado laboral y de bienes',
          eq: '¿En que sentido las familias compiten entre si en la economia?',
          anns: [
            {t:'Analogia familia-pais: las familias compiten en mercado laboral y de bienes, igual que los paises', c:'#81D4FA', b:false},
            {t:'Dentro de una organizacion, los departamentos compiten por presupuesto y talento, igual que las familias compiten en el mercado laboral', c:'#1A5C38', b:false},
            {t:'DISTINCION: competir por recursos NO impide cooperar; la clave es que el intercambio genera valor para ambas partes', c:'#C00000', b:false}
          ]
        },
        {
          text: 'Sin embargo, y a pesar de esta competencia, el bienestar de una familia no mejoraría si se aislara del resto, porque si lo hiciera tendría que cultivar sus propios alimentos, elaborar ropa y construir su casa. Así, resulta evidente que las familias ganan mucho al comerciar unas con otras, ya que este intercambio promueve la especialización. El comercio permite a cada persona especializarse en las actividades que mejor realiza, ya sea cultivar el campo, coser o construir casas. El comerciar permite a las personas comprar una mayor variedad de bienes y servicios a un menor precio.',
          title: 'El comercio permite especializacion y mayor variedad de bienes',
          eq: '¿Por que el aislamiento empobrece y la especializacion enriquece?',
          anns: [
            {t:'Una familia aislada deberia producirlo todo; el comercio permite especializarse y acceder a mas bienes a menor precio', c:'#FFEB3B', b:true},
            {t:'Mecanismo: comercio -> especializacion -> mayor variedad -> menores precios', c:'#81D4FA', b:true},
            {t:'IMPLICACION: las organizaciones que tercerizan funciones no estrategicas (outsourcing) aplican esta misma logica de especializacion', c:'#C55A11', b:false}
          ]
        },
        {
          text: 'Los países, como las familias, se benefician del comercio entre sí, ya que les permite especializarse en lo que hacen mejor, y disfrutar así de una mayor variedad de bienes y servicios. Los japoneses, franceses, egipcios y brasileños son tanto nuestros socios como nuestros competidores en la economía mundial.',
          title: 'Naciones como socios y competidores a la vez',
          eq: '¿Como pueden ser los paises simultaneamente socios y competidores?',
          anns: [
            {t:'Paises se especializan en lo que hacen mejor y comercian para acceder a mayor variedad', c:'#FFEB3B', b:true},
            {t:'Los paises son socios (cooperacion via comercio) Y competidores (rivalidad en mercados)', c:'#81D4FA', b:false},
            {t:'La cadena global de semiconductores (diseño en EE.UU., fabricacion en Taiwan, ensamble en China) ejemplifica especializacion internacional contemporanea', c:'#1A5C38', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Por que el comercio entre paises no es como una competencia deportiva?',
          '¿Que pasaria si una familia se aislara del comercio?',
          '¿Cual es el mecanismo por el cual el comercio beneficia a todos?'
        ],
        a: [
          'Porque no es un juego de suma cero; ambas naciones pueden mejorar su bienestar.',
          'Tendria que producir todo por si misma (alimentos, ropa, vivienda), lo cual seria menos eficiente que especializarse.',
          'El comercio permite la especializacion en lo que cada uno hace mejor, lo cual genera mayor variedad de bienes y servicios a menores precios.'
        ]
      }
    },

    /* ====== SECCION 6: PRINCIPIO 6 ====== */
    {
      title: 'Principio 6: Los mercados normalmente son un buen mecanismo para organizar la actividad economica',
      paragraphs: [
        {
          text: 'La caída del comunismo en la Unión Soviética y en la Europa del Este durante la década de 1980 es, probablemente, el cambio más importante que ha ocurrido en el mundo en los últimos 50 años. Los países comunistas se basaron en la premisa de que el gobierno era el más indicado para asignar los recursos escasos de la economía. Por medio de una planificación central, se decidía qué bienes y servicios debían producirse, en qué cantidad, quién los produciría y debería consumirlos. La planificación central se basaba en la teoría que el gobierno era el único capaz de organizar la actividad económica, de tal manera que se promoviera el bienestar económico del país.',
          title: 'Caida del comunismo y fracaso de la planificacion central',
          eq: '¿Que premisa sostenia los sistemas de planificacion central y por que fracaso?',
          anns: [
            {t:'Planificacion central: el gobierno decide que producir, cuanto, quien produce y quien consume', c:'#FFEB3B', b:true},
            {t:'La caida del comunismo (1980s) es evidencia historica del fracaso de la planificacion central', c:'#81D4FA', b:true},
            {t:'→ CONEXION con Hayek: el problema del conocimiento disperso; ningun planificador central puede agregar la informacion que millones de agentes poseen localmente', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'La mayoría de los países que alguna vez tuvo una economía de manera centralizada ha abandonado ese sistema y está tratando de desarrollar una economía de mercado. En una economía de mercado, las decisiones que antes se tomaban de manera centralizada son sustituidas por las decisiones de millones de empresas y familias. Las empresas son las responsables de decidir a quién contratar y qué fabricar. Las familias, por su parte, deciden dónde trabajar y qué desean comprar con su ingreso. Las empresas y las familias interactúan en el mercado, en donde los precios y el interés personal orientan sus decisiones.',
          title: 'Economia de mercado: decisiones descentralizadas de millones',
          eq: '¿Que papel juegan los precios y el interes personal en una economia de mercado?',
          anns: [
            {t:'CONCEPTO: Economia de mercado = decisiones descentralizadas de millones de hogares y empresas', c:'#FFEB3B', b:true},
            {t:'Precios + interes personal = mecanismos de coordinacion en la economia de mercado', c:'#81D4FA', b:true},
            {t:'DISTINCION: economia de mercado no es ausencia de gobierno; requiere instituciones que garanticen contratos y derechos de propiedad (→ ver P7)', c:'#C00000', b:false}
          ]
        },
        {
          text: 'A primera vista, el éxito de las economías de mercado es desconcertante. En una economía de mercado, o libre mercado, nadie está pendiente del bienestar económico de la sociedad en su conjunto. En el libre mercado coexisten muchos compradores y vendedores de diversos bienes y servicios, y todos ellos buscan, principalmente, su bienestar propio. Sin embargo, y a pesar de que la toma de decisiones se encuentra descentralizada, y de que los tomadores de decisiones buscan su bienestar propio, las economías de mercado han demostrado que son capaces de organizar exitosamente la actividad económica para promover el bienestar general.',
          title: 'La paradoja del mercado: interes propio genera bienestar general',
          eq: '¿Como es posible que el interes propio de millones produzca bienestar colectivo?',
          anns: [
            {t:'Paradoja: nadie busca el bienestar general, pero la economia de mercado lo produce', c:'#FFEB3B', b:true},
            {t:'La descentralizacion funciona: individuos egoistas generan resultados socialmente deseables', c:'#81D4FA', b:false},
            {t:'Wikipedia y el software open-source replican esta logica: contribuciones individuales por interes propio generan un bien publico valioso', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'En 1776, Adam Smith, en su libro titulado Una investigación sobre la naturaleza y las causas de la riqueza de las naciones, hizo la observación más famosa de toda la economía; es decir, afirmó que las familias y las empresas interactúan en los mercados como si fueran guiados por una "mano invisible" que los lleva a obtener los resultados deseables del mercado. Uno de los objetivos de este libro es entender cómo es que funciona la magia de la mano invisible.',
          title: 'Adam Smith y la metafora de la mano invisible (1776)',
          eq: '¿Que quiso decir Adam Smith con la metafora de la mano invisible?',
          anns: [
            {t:'Adam Smith (1776), La riqueza de las naciones: la observacion mas famosa de la economia', c:'#FFEB3B', b:true},
            {t:'CONCEPTO: Mano invisible = metafora de coordinacion espontanea via precios, no mecanismo real', c:'#81D4FA', b:true},
            {t:'DISTINCION: Smith no defiende egoismo puro; en Teoria de los sentimientos morales (1759) argumenta que la simpatia tambien guia la conducta humana', c:'#C00000', b:false}
          ]
        },
        {
          text: 'A medida que usted estudie economía aprenderá que los precios son un instrumento del que se sirve la mano invisible para dirigir la actividad económica. En cualquier mercado, los compradores consideran el precio cuando determinan cuánto comprarán o demandarán de ese bien; del mismo modo, los vendedores examinan el precio cuando deciden lo que van a vender u ofrecer. Como resultado de estas decisiones de compradores y vendedores, los precios de mercado reflejan tanto el valor del bien en la sociedad como el costo que para la sociedad representa producirlo. La gran aportación de Smith fue que los precios se ajustan para guiar a cada uno de los compradores y vendedores a obtener resultados que, en muchos casos, maximizan el bienestar de la sociedad.',
          title: 'Los precios como instrumento de la mano invisible',
          eq: '¿Como transmiten los precios informacion sobre valor social y costo de produccion?',
          anns: [
            {t:'Precios = instrumento de la mano invisible; reflejan valor del bien Y costo de producirlo', c:'#FFEB3B', b:true},
            {t:'Aportacion de Smith: los precios se ajustan para maximizar el bienestar de la sociedad', c:'#81D4FA', b:true},
            {t:'IMPLICACION: en mercados de datos e IA, la falta de precios claros para la privacidad genera asimetrias que la mano invisible no corrige automaticamente', c:'#C55A11', b:false}
          ]
        },
        {
          text: 'Las ideas de Smith tienen un importante corolario: cuando el gobierno impide que los precios se ajusten naturalmente a la oferta y la demanda, impide también que la habilidad de la mano invisible funcione para coordinar las decisiones de millones de hogares y empresas. Este corolario también explica por qué los impuestos afectan negativamente la asignación de los recursos y distorsionan los precios y, por ende, las decisiones de los hogares y las empresas. Por medio del corolario también se explica el gran daño que causan medidas como el control de los precios del alquiler, ya que controlan directamente los precios. También se explica el fracaso del comunismo. No hay que olvidar que en los países comunistas los precios no los determinaba el mercado, sino que eran fijados gracias a una planificación central. Los planificadores carecían de la información necesaria acerca de los consumidores, sus gustos y los costos de los productores, variables que en un libre mercado son reflejadas a través de los precios. Las economías centralizadas fallaron porque trataron de manejar la economía con una mano atada a la espalda: la mano invisible del mercado.',
          title: 'Corolario: interferir con precios destruye la coordinacion',
          eq: '¿Por que los controles de precios y la planificacion central distorsionan la economia?',
          anns: [
            {t:'Corolario de Smith: impedir ajuste de precios = impedir coordinacion de la mano invisible', c:'#FFEB3B', b:true},
            {t:'Impuestos, controles de alquiler, planificacion central: todos distorsionan señales de precios', c:'#81D4FA', b:true},
            {t:'Metafora potente: economias centralizadas manejaban la economia con la mano invisible atada a la espalda', c:'#C5E1A5', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que es una economia de mercado?',
          '¿Que es la mano invisible de Adam Smith?',
          '¿Que papel juegan los precios en la economia de mercado?',
          '¿Por que fracasaron las economias centralizadas?'
        ],
        a: [
          'Una economia que asigna sus recursos mediante las decisiones descentralizadas de numerosos hogares y empresas que interactuan en el mercado.',
          'Es la metafora de Adam Smith sobre como las familias y empresas, al buscar su propio interes en los mercados, son guiados a obtener resultados socialmente deseables.',
          'Son el instrumento de la mano invisible: reflejan el valor del bien y el costo de producirlo, guiando las decisiones de compradores y vendedores.',
          'Porque los planificadores carecian de la informacion sobre gustos y costos que los precios de mercado reflejan; trataron de manejar la economia con la mano invisible atada.'
        ]
      }
    },

    /* ====== SECCION 7: PRINCIPIO 7 ====== */
    {
      title: 'Principio 7: El gobierno puede mejorar algunas veces los resultados del mercado',
      paragraphs: [
        {
          text: 'Si la mano invisible del mercado es tan valiosa, ¿para qué necesitamos del gobierno? Uno de los propósitos del estudio de la economía es redefinir la visión de usted con respecto al adecuado papel y al ámbito correcto de la política gubernamental.',
          title: 'Pregunta central: si el mercado funciona, para que el gobierno',
          eq: '¿En que casos se justifica la intervencion gubernamental si la mano invisible funciona?',
          anns: [
            {t:'Pregunta critica: ¿para que el gobierno si la mano invisible coordina bien?', c:'#81D4FA', b:false},
            {t:'La economia ayuda a redefinir el papel adecuado de la politica gubernamental', c:'#C5E1A5', b:false},
            {t:'↩ RETOMA: P6 mostro que el mercado funciona bien; P7 establece las excepciones y limitaciones de esa conclusion', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Una de las razones por las cuales necesitamos al gobierno es porque la magia de la mano invisible de la economía sólo funciona cuando aquél hace valer las reglas y mantiene las instituciones que son clave para el libre mercado pero, más importante aún es el hecho de que las economías de mercado necesitan instituciones que hagan valer los derechos de propiedad de las personas para que éstas puedan ejercer propiedad y control sobre los recursos escasos. Un campesino no cultivará alimentos si cree que le robarán su cosecha; de igual manera, un restaurante no ofrecerá comidas a menos que haya algo que le asegure que los clientes pagarán antes de irse; una empresa de entretenimiento no producirá dvd si un número importante de clientes potenciales dejan de pagar su producto porque prefieren las copias pirata de los discos. En suma, todos dependemos de la policía y el sistema de justicia que el gobierno proporciona, ya que estas instituciones hacen que los derechos sobre las cosas que producimos se respeten, y la mano invisible confía en nuestra capacidad de hacer respetar nuestros derechos.',
          title: 'Derechos de propiedad: condicion necesaria para el mercado',
          eq: '¿Por que sin derechos de propiedad la mano invisible no puede funcionar?',
          anns: [
            {t:'CONCEPTO: Derechos de propiedad = habilidad de tener y controlar recursos escasos', c:'#FFEB3B', b:true},
            {t:'Sin derechos de propiedad no hay incentivo para producir: campesino, restaurante, empresa de DVD', c:'#81D4FA', b:true},
            {t:'El gobierno proporciona policia y justicia para hacer respetar los derechos de propiedad', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'Pero existe otra razón por la que necesitamos al gobierno. La mano invisible es muy poderosa, pero no omnipotente. Promover la eficiencia y la equidad son las dos grandes razones por las cuales el gobierno debe intervenir en la economía para cambiar la manera en que las personas asignarían los recursos. Es decir, la mayoría de las medidas económicas aspira a agrandar el pastel económico o a cambiar la manera en que se reparte.',
          title: 'Dos razones para intervenir: eficiencia y equidad',
          eq: '¿Cuales son las dos grandes justificaciones para la intervencion gubernamental?',
          anns: [
            {t:'Mano invisible: poderosa pero no omnipotente; hay espacio para la intervencion', c:'#FFEB3B', b:true},
            {t:'Dos razones: (1) promover eficiencia (agrandar el pastel), (2) promover equidad (repartirlo mejor)', c:'#81D4FA', b:true},
            {t:'↩ RETOMA la metafora del pastel de P1: alli introdujo eficiencia (tamaño) vs equidad (reparto); aqui la retoma como justificacion de intervencion', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'Considere como primer objetivo la eficiencia. Aun cuando en general la mano invisible dirige a los mercados a asignar los recursos para maximizar el pastel económico, esto no siempre se logra. Los economistas utilizan el término falla del mercado para referirse a una situación en la cual el mercado, por sí solo, no asigna eficientemente los recursos. Una de las causas posibles de esta falla del mercado puede ser una externalidad, que es el impacto que las acciones de una persona tienen sobre el bienestar de otra. Un ejemplo clásico de externalidad lo constituye la contaminación. Otra posible causa de una falla del mercado es el poder de mercado, que se refiere a la habilidad que tiene una persona, o un pequeño grupo de personas, para influir indebidamente en los precios del mercado. Por ejemplo, si todos los habitantes de un pueblo necesitan agua, pero hay un solo pozo, entonces el propietario del pozo no está sujeto a la competencia rigurosa, con la cual la mano invisible frena el interés personal. En presencia de las externalidades o del poder de mercado, una política bien diseñada puede mejorar la eficiencia económica.',
          title: 'Fallas del mercado: externalidades y poder de mercado',
          eq: '¿Cuales son las dos principales causas de falla del mercado?',
          anns: [
            {t:'CONCEPTO: Falla del mercado = situacion donde el mercado no asigna recursos eficientemente', c:'#FFEB3B', b:true},
            {t:'Causa 1: Externalidad = impacto de acciones de una persona sobre el bienestar de otra (ej. contaminacion)', c:'#81D4FA', b:true},
            {t:'Causa 2: Poder de mercado = capacidad de influir indebidamente en precios (ej. monopolio del pozo)', c:'#81D4FA', b:true}
          ]
        },
        {
          text: 'Ahora considere el objetivo de la equidad. Aun cuando la mano invisible busca la eficiencia económica, no siempre puede garantizar la distribución equitativa de la prosperidad económica. Una economía de mercado recompensa a las personas según su habilidad para producir bienes por los que otros están dispuestos a pagar. El mejor jugador de basquetbol del mundo gana más que el mejor jugador de ajedrez, simple y sencillamente porque las personas están dispuestas a pagar más por asistir a un partido de basquetbol que a uno de ajedrez. La mano invisible no garantiza que todos tengan comida suficiente, ropa digna o atención médica adecuada. Estas inequidades, dependiendo de la filosofía política de cada cual, exigen la intervención gubernamental. En la práctica, muchas de las políticas públicas, como el impuesto sobre la renta y la seguridad social, están encaminadas a lograr una distribución más equitativa del bienestar económico.',
          title: 'El mercado no garantiza equidad: justificacion redistributiva',
          eq: '¿Por que la mano invisible no resuelve el problema de la equidad?',
          anns: [
            {t:'El mercado recompensa segun habilidad para producir lo que otros quieren pagar, no segun necesidad', c:'#FFEB3B', b:true},
            {t:'Basquetbolista vs ajedrecista: el mercado paga mas a quien genera mas demanda', c:'#C5E1A5', b:false},
            {t:'La mano invisible no garantiza comida, ropa ni atencion medica para todos', c:'#81D4FA', b:true}
          ]
        },
        {
          text: 'Afirmar que el gobierno algunas veces puede mejorar los resultados del mercado no significa que siempre lo haga. Las políticas públicas no están hechas por ángeles, sino por un proceso político que dista mucho de ser perfecto. Algunas veces las políticas están diseñadas simplemente para recompensar a quien tiene más poder político. Otras veces están hechas por líderes bien intencionados pero que carecen de información. Al estudiar economía, usted se convertirá en un mejor juez de las políticas económicas, y sabrá discernir entre aquellas que promueven la eficiencia y la equidad y las que no.',
          title: 'El gobierno puede mejorar pero tambien puede fallar',
          eq: '¿Por que la intervencion gubernamental no siempre mejora los resultados del mercado?',
          anns: [
            {t:'Advertencia crucial: el gobierno PUEDE mejorar pero NO SIEMPRE lo hace; las politicas las hacen humanos, no angeles', c:'#FFEB3B', b:true},
            {t:'Fallas de gobierno: poder politico, falta de informacion, incentivos perversos', c:'#81D4FA', b:false},
            {t:'→ CONEXION con Public Choice (Buchanan & Tullock): los politicos tambien responden a incentivos, no siempre alineados con el bienestar social', c:'#5B2C8C', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que son los derechos de propiedad y por que son importantes?',
          '¿Que es una falla del mercado?',
          '¿Cuales son las dos principales causas de falla del mercado?',
          '¿Por que el gobierno no siempre mejora los resultados del mercado?'
        ],
        a: [
          'Son la habilidad de tener y controlar recursos escasos; son importantes porque sin ellos nadie tiene incentivo para producir.',
          'Situacion en la cual el mercado, por si solo, no asigna eficientemente los recursos.',
          'Externalidades (impacto de las acciones de una persona sobre otra) y poder de mercado (capacidad de influir indebidamente en precios).',
          'Porque las politicas publicas no las hacen angeles sino un proceso politico imperfecto, a veces para recompensar al poderoso o con falta de informacion.'
        ]
      }
    },

    /* ====== SECCION 8: PRINCIPIO 8 ====== */
    {
      title: 'Principio 8: El nivel de vida de un pais depende de la capacidad que tenga para producir bienes y servicios',
      paragraphs: [
        {
          text: 'La diferencia en el nivel de vida que existe entre los distintos países del mundo es de llamar la atención. En 2008, por ejemplo, el estadounidense promedio tenía un ingreso anual de aproximadamente 47 000 dólares, mientras que el mexicano promedio recibía cerca de 10 000 y el nigeriano promedio ganaba sólo 1400. Como es de esperar, esta variación tan grande en el ingreso promedio se refleja en diferentes indicadores del nivel de vida. Los ciudadanos de los países con mayor ingreso tienen más televisores, más automóviles, mejor alimentación, mejor sistema de salud y esperanza de vida mayor que los ciudadanos de los países con un menor ingreso.',
          title: 'Enormes diferencias en nivel de vida entre paises',
          eq: '¿Que magnitud tienen las diferencias en nivel de vida entre paises ricos y pobres?',
          anns: [
            {t:'Datos 2008: EE.UU. $47,000 vs Mexico $10,000 vs Nigeria $1,400 de ingreso anual promedio', c:'#FFEB3B', b:true},
            {t:'Mayor ingreso se traduce en mejor alimentacion, salud, esperanza de vida, etc.', c:'#C5E1A5', b:false},
            {t:'DISTINCION: el ingreso promedio oculta la desigualdad interna; un pais con alto PIB per capita puede tener millones en pobreza (→ ver P1: eficiencia vs equidad)', c:'#C00000', b:false}
          ]
        },
        {
          text: 'A lo largo del tiempo, los cambios en el nivel de vida son también muy importantes. En Estados Unidos el ingreso ha crecido históricamente a un ritmo de 2% anual (después de hacer los ajustes por los cambios en el costo de vida). A esta tasa, el ingreso promedio se duplica cada 35 años y a lo largo del siglo pasado se multiplicó aproximadamente ocho veces.',
          title: 'Crecimiento historico: 2% anual duplica ingreso cada 35 años',
          eq: '¿Por que un crecimiento de solo 2% anual tiene un impacto tan grande a largo plazo?',
          anns: [
            {t:'Efecto del interes compuesto: 2% anual duplica ingreso en 35 años, x8 en un siglo', c:'#FFEB3B', b:true},
            {t:'Pequeñas diferencias en tasas de crecimiento generan brechas enormes entre paises a largo plazo: China crecio al 10% y se transformo en dos decadas', c:'#1A5C38', b:false},
            {t:'IMPLICACION: para una empresa, un 2% de mejora anual en productividad parece modesto pero transforma la competitividad en una generacion', c:'#C55A11', b:false}
          ]
        },
        {
          text: '¿Cómo se explican estas grandes diferencias entre los niveles de vida de los diferentes países y las distintas épocas? La respuesta es sorprendentemente simple. Casi todas las variaciones de los niveles de vida pueden atribuirse a las diferencias existentes entre los niveles de productividad de los países; esto es, la cantidad de bienes y servicios producidos por cada unidad de trabajo. En los países donde los trabajadores son capaces de producir una gran cantidad de bienes y servicios por unidad de tiempo, la mayoría de las personas disfruta de un alto nivel de vida. Al mismo tiempo, en los países donde los trabajadores son menos productivos la mayoría de la población lleva una existencia más precaria. Asimismo, la tasa de crecimiento de la productividad de un país determina la tasa de crecimiento del ingreso promedio.',
          title: 'Productividad: la explicacion fundamental del nivel de vida',
          eq: '¿Por que la productividad es la variable que mas explica las diferencias en nivel de vida?',
          anns: [
            {t:'CONCEPTO: Productividad = cantidad de bienes y servicios producidos por cada unidad de trabajo', c:'#FFEB3B', b:true},
            {t:'Casi TODAS las variaciones en nivel de vida se atribuyen a diferencias en productividad', c:'#81D4FA', b:true},
            {t:'La tasa de crecimiento de la productividad determina la tasa de crecimiento del ingreso', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'La relación fundamental entre productividad y nivel de vida es simple, pero sus consecuencias son de gran trascendencia. Si la productividad es el principal determinante del nivel de vida, otras explicaciones deben tener importancia secundaria. Por ejemplo, resulta tentador atribuir a los sindicatos o a las leyes sobre el salario mínimo el aumento que ha experimentado el nivel de vida del trabajador estadounidense en los últimos 100 años. Sin embargo, el verdadero héroe para los trabajadores estadounidenses es el aumento de su productividad. Pongamos otro ejemplo: algunos observadores han afirmado que el aumento de la competencia por parte de Japón y otros países explica el lento crecimiento del ingreso en Estados Unidos durante las décadas de 1970 y 1980. Sin embargo, el verdadero culpable no es la competencia externa, sino el crecimiento cada vez menor de la productividad en Estados Unidos.',
          title: 'Productividad supera a sindicatos y competencia externa como causa',
          eq: '¿Por que la productividad es mas importante que los sindicatos o la competencia internacional?',
          anns: [
            {t:'Si la productividad es el determinante principal, sindicatos y salario minimo son secundarios', c:'#FFEB3B', b:true},
            {t:'El verdadero heroe del nivel de vida de EE.UU. es la productividad, no los sindicatos', c:'#81D4FA', b:true},
            {t:'Crecimiento lento 1970-80: no fue la competencia japonesa sino la baja productividad interna', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'La relación entre la productividad y el nivel de vida tiene también profundas implicaciones en la política pública. Cuando pensamos en cómo una medida afectará los niveles de vida, la pregunta clave es cómo afectará esta medida nuestra capacidad para producir bienes y servicios. Con objeto de incrementar los niveles de vida, los diseñadores de políticas deben incrementar la productividad, asegurando que los trabajadores tengan un buen nivel de estudios, dispongan de las herramientas necesarias para producir los bienes y servicios, y puedan tener acceso a la mejor tecnología existente.',
          title: 'Implicacion politica: elevar productividad via educacion y tecnologia',
          eq: '¿Que debe hacer la politica publica para mejorar los niveles de vida?',
          anns: [
            {t:'Politica publica debe enfocarse en la pregunta: ¿como afecta esta medida la productividad?', c:'#FFEB3B', b:true},
            {t:'Tres palancas: educacion, herramientas de produccion y acceso a la mejor tecnologia', c:'#81D4FA', b:true},
            {t:'La adopcion organizacional de IA y supercomputacion encaja en las tres palancas: capacitacion (educacion), infraestructura (herramientas) y transferencia tecnologica', c:'#1A5C38', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que es la productividad?',
          '¿Que explica las diferencias en nivel de vida entre paises?',
          '¿Cual es el verdadero heroe del nivel de vida de los trabajadores estadounidenses?',
          '¿Como pueden las politicas publicas incrementar el nivel de vida?'
        ],
        a: [
          'La cantidad de bienes y servicios producidos por cada unidad de trabajo.',
          'Casi todas las variaciones se atribuyen a las diferencias en productividad.',
          'El aumento de la productividad, no los sindicatos ni las leyes de salario minimo.',
          'Incrementando la productividad: asegurando buen nivel educativo, herramientas de produccion y acceso a la mejor tecnologia.'
        ]
      }
    },

    /* ====== SECCION 9: PRINCIPIO 9 ====== */
    {
      title: 'Principio 9: Cuando el gobierno imprime demasiado dinero los precios se incrementan',
      paragraphs: [
        {
          text: 'En enero de 1921, un periódico en Alemania costaba 30 centavos de marco. Menos de dos años después, en noviembre de 1922, el mismo periódico tenía un precio de 70 000 000 de marcos y todos los precios de la economía alemana aumentaron al mismo ritmo. Este fenómeno es uno de los ejemplos históricos más relevantes de inflación, que es un incremento en el nivel general de los precios en la economía.',
          title: 'Hiperinflacion alemana 1921-1922: de 30 centavos a 70 millones',
          eq: '¿Que magnitud puede alcanzar la inflacion cuando se descontrola?',
          anns: [
            {t:'Ejemplo dramatico: periodico aleman paso de 0.30 marcos (1921) a 70,000,000 marcos (1922)', c:'#FFEB3B', b:true},
            {t:'CONCEPTO: Inflacion = incremento en el nivel general de los precios en la economia', c:'#FFEB3B', b:true},
            {t:'Venezuela (2018-2019) y Zimbabwe (2008) son ejemplos contemporaneos de hiperinflacion con dinamicas similares a la Alemania de Weimar', c:'#1A5C38', b:false}
          ]
        },
        {
          text: 'Aun cuando en Estados Unidos nunca se ha experimentado una inflación tan grande como la que se vivió en Alemania en la década de 1920, la inflación ha sido un problema en algunas épocas. En la década de 1970, por ejemplo, cuando el nivel generalizado de los precios aumentó a más del doble, el entonces presidente de Estados Unidos, Gerald Ford, denominó a la inflación "el enemigo público número uno". Por el contrario, la inflación en la primera década del siglo xxi ha sido cercana a 2.5% por año, lo que significa que a este ritmo los precios necesitarían 30 años para duplicarse. Debido en que una alta tasa de inflación impone varios costos a la sociedad, mantener la inflación a un nivel bajo es uno de los objetivos de los diseñadores de las políticas económicas de los diferentes países del mundo.',
          title: 'Inflacion moderada vs alta: EE.UU. en los 70s y siglo XXI',
          eq: '¿Por que es importante mantener la inflacion baja?',
          anns: [
            {t:'Gerald Ford (1970s): la inflacion es "el enemigo publico numero uno"', c:'#C5E1A5', b:false},
            {t:'Inflacion alta impone costos a la sociedad; mantenerla baja es objetivo de politica economica', c:'#FFEB3B', b:true},
            {t:'IMPLICACION: la inflacion erosiona la planificacion empresarial a largo plazo; las organizaciones no pueden invertir racionalmente si los precios son impredecibles', c:'#C55A11', b:false}
          ]
        },
        {
          text: '¿Qué provoca la inflación? En la mayoría de los casos en que la inflación es alta y se mantiene alta por un tiempo, el culpable es un aumento en la cantidad de dinero en circulación. Cuando un gobierno emite grandes cantidades de dinero, el valor de éste disminuye. Por ejemplo, a principios de 1920, en Alemania, cuando los precios se triplicaban en promedio cada mes, la cantidad de dinero que el gobierno emitía también se triplicaba mensualmente. En Estados Unidos, aun cuando la historia económica de ese país es menos dramática, la conclusión es la misma: la alta tasa de inflación experimentada en la década de 1970 se relacionó con un rápido aumento en la cantidad de dinero en circulación y, del mismo modo, la baja inflación en años recientes está asociada con un lento crecimiento de la cantidad de dinero.',
          title: 'Causa de la inflacion: exceso de emision monetaria',
          eq: '¿Cual es la relacion entre la cantidad de dinero y el nivel de precios?',
          anns: [
            {t:'En la mayoria de los casos, inflacion alta y persistente = exceso de emision de dinero', c:'#FFEB3B', b:true},
            {t:'Alemania 1920: precios se triplicaban cada mes porque el dinero emitido tambien se triplicaba', c:'#81D4FA', b:true},
            {t:'EE.UU.: alta inflacion en los 70s = rapido aumento monetario; baja inflacion reciente = crecimiento lento del dinero', c:'#C5E1A5', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que es la inflacion?',
          '¿Que causa la inflacion alta y persistente?',
          '¿Que ejemplo historico ilustra la hiperinflacion?',
          '¿Como se relacionaron la cantidad de dinero y la inflacion en EE.UU. en los años 70?'
        ],
        a: [
          'Un incremento en el nivel general de los precios en la economia.',
          'Un aumento en la cantidad de dinero en circulacion; cuando el gobierno emite demasiado dinero, su valor disminuye.',
          'Alemania 1921-1922: un periodico paso de 30 centavos a 70 millones de marcos.',
          'La alta inflacion de los 70s se relaciono con un rapido aumento en la cantidad de dinero en circulacion.'
        ]
      }
    },

    /* ====== SECCION 10: PRINCIPIO 10 ====== */
    {
      title: 'Principio 10: La sociedad enfrenta a corto plazo una disyuntiva entre inflacion y desempleo',
      paragraphs: [
        {
          text: 'Aun cuando a largo plazo el principal efecto de un incremento en la cantidad de dinero es el incremento de los precios, a corto plazo su efecto es más complejo y controversial. La mayoría de los economistas describe los efectos a corto plazo de un incremento de dinero de la siguiente manera: En la economía, un incremento en la cantidad de dinero estimula el nivel total de gasto y, por ende, estimula también la demanda de bienes y servicios. Con el tiempo, un incremento en la demanda puede ocasionar que las empresas incrementen sus precios, pero antes de que esto suceda, este incremento en la demanda estimula a las empresas para que produzcan más bienes y contraten más trabajadores. Un incremento en el número de trabajadores contratados reduce el desempleo.',
          title: 'A corto plazo mas dinero reduce desempleo antes de subir precios',
          eq: '¿Por que los efectos a corto plazo del dinero son diferentes de los de largo plazo?',
          anns: [
            {t:'Largo plazo: mas dinero = mas inflacion. Corto plazo: mas dinero = mas demanda = mas empleo', c:'#FFEB3B', b:true},
            {t:'Secuencia corto plazo: mas dinero -> mas gasto -> mas demanda -> mas produccion -> menos desempleo', c:'#81D4FA', b:true},
            {t:'Solo DESPUES las empresas suben precios; antes contratan mas trabajadores', c:'#C5E1A5', b:false}
          ]
        },
        {
          text: 'Este tipo de razonamiento lleva a la economía, a corto plazo, a enfrentar una disyuntiva entre inflación y desempleo. Aunque algunos economistas todavía cuestionan estas ideas, la mayoría acepta que, a corto plazo, la sociedad enfrenta una disyuntiva entre inflación y desempleo. Esto significa que, en un periodo de uno o dos años, varias de las políticas económicas influyen en la inflación y el desempleo en sentidos contrarios. Independientemente de que los niveles de inflación y desempleo sean altos, como en Estados Unidos a principios de la década de 1980, bajos, como a finales de la década de 1990, o algo intermedio, las autoridades económicas enfrentan esta disyuntiva. A corto plazo, la disyuntiva entre desempleo e inflación desempeña un papel clave en el análisis del ciclo económico, el cual consiste en fluctuaciones irregulares y en gran medida impredecibles de la actividad económica, medida ésta por la producción de bienes y servicios, o por el número de personas empleadas.',
          title: 'Disyuntiva inflacion-desempleo y el ciclo economico',
          eq: '¿Por que la disyuntiva inflacion-desempleo solo aplica a corto plazo?',
          anns: [
            {t:'Disyuntiva inflacion vs desempleo: solo a CORTO PLAZO (1-2 años), no a largo plazo', c:'#FFEB3B', b:true},
            {t:'CONCEPTO: Ciclo economico = fluctuaciones irregulares e impredecibles de la actividad economica', c:'#FFEB3B', b:true},
            {t:'Las politicas economicas influyen en inflacion y desempleo en sentidos contrarios', c:'#81D4FA', b:false}
          ]
        },
        {
          text: 'A corto plazo, los diseñadores de políticas económicas pueden explotar esta disyuntiva utilizando diversos instrumentos. Pueden cambiar, por ejemplo, la cantidad que gasta el gobierno, el monto de los impuestos, la cantidad de dinero que se imprime; en fin, que dichas autoridades pueden influir en la demanda global de bienes y servicios. Los cambios en la demanda, a su vez, influyen en la combinación de inflación y desempleo que la economía experimenta a corto plazo. Debido a que estos instrumentos de política económica son muy poderosos en potencia, la manera en que los diseñadores de las políticas económicas deben usarlos para controlar la economía, si acaso deben usarlos, es tema de incontables debates.',
          title: 'Instrumentos de politica: gasto, impuestos y emision monetaria',
          eq: '¿Que instrumentos tienen las autoridades para influir en la disyuntiva inflacion-desempleo?',
          anns: [
            {t:'Instrumentos: gasto gubernamental, impuestos, emision de dinero -> afectan demanda global', c:'#FFEB3B', b:true},
            {t:'El uso de estos instrumentos es poderoso pero debatido: ¿deben usarse o no?', c:'#81D4FA', b:false},
            {t:'→ CONEXION: el debate Keynes vs Friedman se centra aqui: Keynes prioriza politica fiscal (gasto), Friedman prioriza politica monetaria (dinero)', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'El debate se hizo aún más intenso en los primeros años de la presidencia de Barack Obama. En 2008 y 2009, la economía de Estados Unidos, al igual que muchas otras economías del mundo, experimentaron una grave recesión económica. Los problemas del sistema financiero, ocasionados por malas inversiones en el mercado de vivienda, se propagaron al resto de la economía y provocaron que el ingreso cayera y el desempleo aumentara de manera exorbitante. Las autoridades gubernamentales respondieron de diversas formas para incrementar la demanda general de bienes y servicios. La primera iniciativa importante del presidente Obama fue un paquete de estímulos económicos para reducir los impuestos y aumentar el gasto gubernamental. Al mismo tiempo, el banco central del país, la Reserva Federal, incrementó la oferta de dinero. El objetivo de estas políticas fue reducir el desempleo. Sin embargo, algunos expresaron su temor de que estas políticas pudieran provocar, con el tiempo, un nivel de inflación excesivo.',
          title: 'Crisis 2008-2009: estimulos de Obama y riesgo inflacionario',
          eq: '¿Como ilustra la crisis de 2008-2009 la disyuntiva entre inflacion y desempleo?',
          anns: [
            {t:'Crisis 2008-2009: malas inversiones en vivienda -> colapso financiero -> recesion -> desempleo alto', c:'#FFEB3B', b:true},
            {t:'Respuesta Obama: estimulos fiscales (menos impuestos, mas gasto) + Reserva Federal incremento oferta de dinero', c:'#81D4FA', b:true},
            {t:'Dilema real: reducir desempleo HOY vs riesgo de inflacion excesiva MAÑANA', c:'#C5E1A5', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Que relacion existe a corto plazo entre inflacion y desempleo?',
          '¿Que es el ciclo economico?',
          '¿Que instrumentos usan las autoridades para influir en la demanda?',
          '¿Como respondio el gobierno de Obama a la crisis de 2008-2009?'
        ],
        a: [
          'Existe una disyuntiva: las politicas que reducen desempleo tienden a aumentar la inflacion y viceversa.',
          'Fluctuaciones irregulares y en gran medida impredecibles de la actividad economica, medidas por produccion o empleo.',
          'Gasto gubernamental, impuestos y cantidad de dinero que se imprime.',
          'Con estimulos fiscales (reduccion de impuestos y aumento del gasto) y politica monetaria expansiva (la Reserva Federal incremento la oferta de dinero).'
        ]
      }
    },

    /* ====== SECCION 11: CONCLUSION ====== */
    {
      title: 'Conclusion',
      paragraphs: [
        {
          text: 'Ahora usted tiene una idea más clara de lo que es la economía. En los capítulos siguientes se exponen conocimientos específicos sobre los individuos, los mercados y las economías. Dominar estos conocimientos requerirá esforzarse, pero no será una tarea especialmente difícil. El campo de la economía se basa en algunas ideas que pueden aplicarse en diferentes situaciones.',
          title: 'La economia se basa en pocas ideas aplicables a muchas situaciones',
          eq: '¿Por que Mankiw afirma que dominar la economia no es especialmente dificil?',
          anns: [
            {t:'La economia se basa en pocas ideas fundamentales aplicables en multiples contextos', c:'#FFEB3B', b:true},
            {t:'Los tres niveles: individuos, mercados y economias como estructura del libro', c:'#C5E1A5', b:false},
            {t:'→ CONEXION: esta parsimonia teorica (pocas ideas, muchas aplicaciones) es un ideal cientifico compartido con la fisica y la teoria organizacional basada en principios', c:'#5B2C8C', b:false}
          ]
        },
        {
          text: 'A lo largo del libro nos referiremos a los Diez principios de la economía destacados en este capítulo y que se encuentran resumidos en el cuadro 1. Usted deberá tener siempre presente estos principios, ya que aun los más complejos análisis económicos encuentran su base en ellos.',
          title: 'Los 10 principios como base de todo analisis economico',
          eq: '¿Por que los 10 principios son el fundamento de todos los analisis economicos posteriores?',
          anns: [
            {t:'Los 10 principios son el ADN de toda la disciplina: incluso los analisis mas complejos se basan en ellos', c:'#FFEB3B', b:true},
            {t:'Funcion del capitulo 1: marco de referencia permanente para el resto del libro', c:'#81D4FA', b:false},
            {t:'IMPLICACION: dominar estos 10 principios proporciona al investigador doctoral un vocabulario analitico para evaluar decisiones organizacionales desde la logica economica', c:'#C55A11', b:false}
          ]
        }
      ],
      retrieval: {
        q: [
          '¿Cual es la estructura general del libro segun la conclusion?',
          '¿Por que los 10 principios son importantes para todo el estudio de la economia?'
        ],
        a: [
          'El libro cubre individuos, mercados y economias en su conjunto, todo fundamentado en los 10 principios.',
          'Porque aun los analisis mas complejos encuentran su base en estos principios fundamentales.'
        ]
      }
    }
  ],

  prelectura: {
    posicionamiento: [
      {
        q: '¿A qué debate responde?',
        a: 'Al debate fundacional sobre qué es la economía y cómo deben organizarse las sociedades para administrar recursos escasos. El texto se inscribe en la tensión histórica entre la economía de mercado (tradición de Adam Smith) y la planificación central (tradición socialista/comunista). Mankiw toma partido explícito por el mercado como mecanismo de coordinación, pero reconoce sus fallas y la necesidad de intervención gubernamental en ciertos casos.'
      },
      {
        q: '¿Con quién dialoga?',
        a: 'Principalmente con Adam Smith (liberalismo clásico, mano invisible), la tradición neoclásica (marginalismo de Jevons, Menger, Walras), la economía del bienestar (eficiencia vs equidad), y la macroeconomía keynesiana y monetarista (inflación, desempleo, ciclo económico). También dialoga implícitamente con la economía conductual al asumir racionalidad plena, y con el institucionalismo al destacar los derechos de propiedad como condición del mercado.'
      },
      {
        q: '¿Qué gap llena?',
        a: 'Provee un marco sintético de 10 principios que unifican microeconomía (decisiones individuales), economía de la interacción (comercio, mercados, gobierno) y macroeconomía (productividad, inflación, ciclo económico) en un solo esquema accesible. El gap que llena es pedagógico y conceptual: ofrece una puerta de entrada al pensamiento económico que conecta lo cotidiano con lo teórico sin sacrificar rigor.'
      },
      {
        q: 'Tradición teórica',
        a: 'Economía neoclásica y síntesis neoclásica-keynesiana. Mankiw es uno de los exponentes más influyentes del nuevo keynesianismo, que combina los fundamentos microeconómicos neoclásicos con el reconocimiento de rigideces nominales y fallas de mercado que justifican la intervención gubernamental a corto plazo. Su manual es el libro de texto de economía más utilizado en el mundo.'
      },
      {
        q: 'Relevancia doctoral',
        a: 'Los principios de escasez, costo de oportunidad e incentivos son directamente aplicables al análisis de decisiones organizacionales en contextos de adopción de IA y supercomputación. El concepto de falla del mercado (externalidades, poder de mercado) es útil para analizar la concentración tecnológica. La disyuntiva eficiencia-equidad ilumina debates sobre automatización y desplazamiento laboral en las organizaciones que estudia la tesis.'
      }
    ],
    esqueleto: {
      tesis: 'Toda la complejidad de la actividad económica puede organizarse en diez principios fundamentales agrupados en tres niveles de análisis: (1) cómo toman decisiones los individuos (principios 1-4: disyuntivas, costo de oportunidad, pensamiento marginal e incentivos), (2) cómo interactúan las personas entre sí (principios 5-7: comercio, mercados y gobierno), y (3) cómo funciona la economía en su conjunto (principios 8-10: productividad, inflación y la disyuntiva inflación-desempleo). El hilo conductor es la escasez: porque los recursos son limitados, las sociedades deben elegir, y esas elecciones tienen consecuencias predecibles que estos principios capturan.',
      pasos: [
        {
          paso: 'PASO 1',
          desc: 'Establece que la escasez es el problema fundacional de toda la economía: la sociedad tiene recursos limitados y no puede producir todos los bienes y servicios que las personas desean. Introduce la definición de economía como la administración de esos recursos escasos.',
          ref: 'Intro'
        },
        {
          paso: 'PASO 2',
          desc: 'Deriva cuatro principios de decisión individual a partir de la escasez: (P1) toda decisión implica una renuncia, (P2) el costo real incluye lo sacrificado (costo de oportunidad), (P3) las decisiones óptimas se toman en el margen, y (P4) los incentivos guían la conducta.',
          ref: 'P1-P4'
        },
        {
          paso: 'PASO 3',
          desc: 'Muestra tres principios de interacción social: (P5) el comercio permite la especialización y beneficia a todos, (P6) los mercados coordinan vía precios (mano invisible), y (P7) el gobierno puede corregir fallas del mercado y promover equidad.',
          ref: 'P5-P7'
        },
        {
          paso: 'PASO 4',
          desc: 'Presenta tres principios macroeconómicos: (P8) la productividad determina el nivel de vida, (P9) la emisión excesiva de dinero causa inflación, y (P10) a corto plazo existe una disyuntiva entre inflación y desempleo vinculada al ciclo económico.',
          ref: 'P8-P10'
        },
        {
          paso: 'CONCLUSIÓN',
          desc: 'Cierra afirmando que los diez principios son el marco unificador de toda la disciplina económica: incluso los análisis más complejos encuentran su base en ellos. El capítulo funciona como una hoja de ruta para el resto del libro.',
          ref: 'Conclusión'
        }
      ]
    },
    resumen: [
      {
        sec: 'Introducción',
        desc: 'La economía proviene del griego oikonomos (administrar una casa). La sociedad, como un hogar, debe decidir cómo asignar recursos escasos. La economía estudia cómo la sociedad administra esos recursos en tres niveles: decisiones individuales, interacciones y agregado.',
        ref: 'pp. 3-4'
      },
      {
        sec: 'Principio 1: Disyuntivas',
        desc: 'Para obtener algo, hay que renunciar a otra cosa. Las disyuntivas operan a nivel individual (tiempo del estudiante), familiar (ingreso), y social (pan vs armas, eficiencia vs equidad). Reconocerlas es condición necesaria para decidir bien.',
        ref: 'pp. 4-5'
      },
      {
        sec: 'Principio 2: Costo de oportunidad',
        desc: 'El costo real de algo es aquello a lo que se renuncia para obtenerlo. El ejemplo de la universidad muestra que el tiempo (salario no percibido) es el mayor costo, no los gastos directos. Los deportistas colegiales ejemplifican costos de oportunidad altísimos.',
        ref: 'pp. 5-6'
      },
      {
        sec: 'Principio 3: Pensamiento marginal',
        desc: 'Las decisiones no son de todo o nada sino ajustes en el margen. La línea aérea vende un asiento vacío a $300 porque el costo marginal es casi cero, aunque el costo promedio sea $500. La paradoja agua-diamantes se resuelve con el beneficio marginal.',
        ref: 'pp. 6-7'
      },
      {
        sec: 'Principio 4: Incentivos',
        desc: 'Un incentivo induce a actuar (recompensa o castigo). Los cinturones de seguridad reducen el costo personal del accidente, lo que lleva a conducir con menos cuidado. Peltzman (1975) demostró que más seguridad vehicular aumentó accidentes de peatones.',
        ref: 'pp. 7-9'
      },
      {
        sec: 'Principio 5: Comercio',
        desc: 'El comercio no es suma cero. Permite la especialización: cada persona o país produce lo que hace mejor y accede a mayor variedad a menor precio. El aislamiento empobrece; la integración comercial enriquece.',
        ref: 'pp. 9-10'
      },
      {
        sec: 'Principio 6: Mercados',
        desc: 'Las economías de mercado asignan recursos mediante decisiones descentralizadas de millones de hogares y empresas. Adam Smith (1776) describió esto como la mano invisible: los precios coordinan intereses individuales para producir bienestar colectivo.',
        ref: 'pp. 10-12'
      },
      {
        sec: 'Principio 7: Gobierno',
        desc: 'La mano invisible no es omnipotente. El gobierno se justifica para hacer valer derechos de propiedad, corregir fallas del mercado (externalidades, poder de mercado) y promover equidad. Pero el gobierno también puede fallar.',
        ref: 'pp. 12-13'
      },
      {
        sec: 'Principio 8: Productividad',
        desc: 'Casi todas las diferencias en nivel de vida entre países se explican por diferencias en productividad (bienes y servicios por unidad de trabajo). La política pública debe enfocarse en educación, herramientas y tecnología para elevar la productividad.',
        ref: 'pp. 13-14'
      },
      {
        sec: 'Principio 9: Inflación',
        desc: 'La inflación es el incremento generalizado de precios. Su causa principal es la emisión excesiva de dinero. La hiperinflación alemana (1921-22) es el ejemplo más dramático: un periódico pasó de 0.30 a 70 millones de marcos.',
        ref: 'pp. 14-15'
      },
      {
        sec: 'Principio 10: Inflación vs desempleo',
        desc: 'A corto plazo (1-2 años), más dinero estimula demanda, producción y empleo antes de subir precios. La disyuntiva inflación-desempleo es central en el ciclo económico. Obama respondió a la crisis 2008-09 con estímulos fiscales y monetarios.',
        ref: 'pp. 15-17'
      },
      {
        sec: 'Conclusión',
        desc: 'Los diez principios son el marco unificador de toda la disciplina. Incluso los análisis más complejos se fundamentan en ellos. El capítulo funciona como hoja de ruta para el resto del libro de Mankiw.',
        ref: 'p. 17'
      }
    ],
    alertas: [
      {
        n: 1,
        texto: 'El costo de oportunidad incluye costos NO monetarios, especialmente el tiempo. Confundir costo de oportunidad con gasto directo lleva a subestimar el costo real de decisiones como asistir a la universidad. Mankiw enfatiza que el salario no percibido es el costo más alto, no la matrícula ni los libros.'
      },
      {
        n: 2,
        texto: 'La paradoja del agua y los diamantes se resuelve con pensamiento MARGINAL, no con el valor total. Es un error común pensar que el agua debería ser más cara porque es esencial. La clave es que el agua es abundante (bajo beneficio marginal por unidad adicional) mientras que los diamantes son escasos (alto beneficio marginal).'
      },
      {
        n: 3,
        texto: 'Los cinturones de seguridad pueden AUMENTAR los accidentes totales (Peltzman, 1975). Esto no es una anécdota sino un principio general: cuando una medida reduce el costo personal de un riesgo, las personas asumen más riesgo. Los peatones son los perdedores porque enfrentan más accidentes sin beneficiarse de la protección del cinturón.'
      },
      {
        n: 4,
        texto: 'La mano invisible NO es un mecanismo real ni una fuerza mística: es una metáfora de Adam Smith para describir cómo los precios coordinan millones de decisiones descentralizadas. Tratarla como una entidad que controla el mercado es un malentendido frecuente que oscurece el mecanismo real (ajuste de precios por oferta y demanda).'
      },
      {
        n: 5,
        texto: 'La disyuntiva inflación-desempleo es SOLO de corto plazo (1-2 años). A largo plazo, la inflación alta y persistente se explica exclusivamente por exceso de emisión monetaria. Confundir el horizonte temporal lleva a conclusiones erróneas sobre política económica: lo que funciona a corto plazo (estimular demanda) puede ser contraproducente a largo plazo.'
      }
    ],
    citables: [
      {uso:'Definir', cita:'La economia es el estudio de como la sociedad administra sus recursos que son escasos.', ref:'Mankiw (2012, p. 4)'},
      {uso:'Definir', cita:'El costo de oportunidad de una cosa es aquello a lo que renunciamos para conseguirla.', ref:'Mankiw (2012, p. 6)'},
      {uso:'Explicar', cita:'Un tomador de decisiones racional emprende una accion si y solo si el beneficio marginal es mayor al costo marginal.', ref:'Mankiw (2012, p. 7)'},
      {uso:'Justificar', cita:'Las personas responden a los incentivos, lo demas es irrelevante.', ref:'Mankiw (2012, p. 7)'},
      {uso:'Explicar', cita:'Las familias y las empresas interactuan en los mercados como si fueran guiados por una mano invisible.', ref:'Mankiw (2012, p. 11)'},
      {uso:'Debatir', cita:'Las economias centralizadas fallaron porque trataron de manejar la economia con una mano atada a la espalda.', ref:'Mankiw (2012, p. 11)'},
      {uso:'Fundamentar', cita:'Casi todas las variaciones de los niveles de vida pueden atribuirse a las diferencias en productividad.', ref:'Mankiw (2012, p. 14)'},
      {uso:'Explicar', cita:'En la mayoria de los casos en que la inflacion es alta, el culpable es un aumento en la cantidad de dinero.', ref:'Mankiw (2012, p. 15)'}
    ]
  },

  puente: [
    {
      emoji: '🎯',
      q: '¿Qué argumento de MI tesis respalda este texto?',
      hint: 'Ej: "El concepto de costo de oportunidad (P2) fundamenta la tensión exploitation-exploration en organizaciones que deben decidir entre explotar capacidades existentes e invertir en IA."'
    },
    {
      emoji: '⚡',
      q: '¿Con qué posición teórica de este texto quiero debatir o matizar?',
      hint: 'Ej: "El supuesto de racionalidad plena (P3) ignora los sesgos cognitivos documentados por Kahneman; las organizaciones no deciden marginalmente de forma racional al adoptar IA."'
    },
    {
      emoji: '🔍',
      q: '¿Qué gap de investigación me revela este texto?',
      hint: 'Ej: "Mankiw no aborda cómo la IA altera la estructura de incentivos (P4) dentro de las organizaciones: si la IA reduce el costo del error, ¿los empleados toman más riesgos?"'
    },
    {
      emoji: '✍️',
      q: '¿Cómo lo citaría en mi marco teórico?',
      hint: 'Ej: "Siguiendo a Mankiw (2012), quien define la productividad como la cantidad de bienes producidos por unidad de trabajo, este estudio examina cómo la supercomputación altera esta ratio en organizaciones intensivas en conocimiento."'
    },
    {
      emoji: '❓',
      q: '¿Qué sigo sin entender después de la pre-lectura?',
      hint: 'Registra las dudas que queden abiertas. Te guiarán durante la lectura anotada.'
    }
  ],

  flujo: {
    sesiones: [
      {nombre: 'Pre-lectura (Sección A)', tiempo: '5-7 min'},
      {nombre: 'Puente a tu tesis (Sección A.2)', tiempo: '10-12 min'},
      {nombre: 'Lectura anotada (Sección B)', tiempo: '40-50 min'},
      {nombre: 'Retrieval activo (dentro de B)', tiempo: '15 min total'},
      {nombre: 'Glosario (Sección C)', tiempo: '10 min'},
      {nombre: 'Protocolo de revisión (Sección C.2)', tiempo: '5 min'}
    ],
    revision: [
      {sesion: 'Sesión 1 — Hoy', tiempo: '15-20 min', fecha: '2026-03-27', tareas: 'Retrieval completo + glosario + puente'},
      {sesion: 'Sesión 2 — 7 días', tiempo: '10-12 min', fecha: '2026-04-03', tareas: 'Retrieval fallado + tensiones + uso en tesis'},
      {sesion: 'Sesión 3 — 30 días', tiempo: '8-10 min', fecha: '2026-04-27', tareas: 'Glosario + retrieval difícil + 2 conexiones'}
    ]
  },

  glosario: [
    {
      concepto: 'Escasez',
      peso: 'critico',
      definicion: 'Carácter limitado de los recursos de la sociedad que impide producir todos los bienes y servicios que las personas desean; es el problema fundacional de toda la economía y la razón de ser de la disciplina.',
      anidamiento: 'Concepto raíz. Contiene: Economía, Disyuntivas, Costo de oportunidad.',
      tension: 'Escasez como condición universal e inevitable ↔ Abundancia post-escasez prometida por la tecnología y la automatización.',
      origen: 'Economía clásica (Smith, Ricardo); fundamento de toda la disciplina'
    },
    {
      concepto: 'Economia',
      peso: 'critico',
      definicion: 'Estudio de cómo la sociedad administra sus recursos que son escasos, abarcando tres niveles de análisis: decisiones individuales, interacciones entre personas y funcionamiento de la economía en su conjunto.',
      anidamiento: 'Hijo de: Escasez. Contiene: Eficiencia, Equidad, Economía de mercado, Productividad.',
      tension: 'Economía como ciencia positiva que describe lo que es ↔ Economía como ciencia normativa que prescribe lo que debería ser.',
      origen: 'Griego oikonomos (el que administra una casa)'
    },
    {
      concepto: 'Eficiencia',
      peso: 'importante',
      definicion: 'Propiedad de la sociedad que consiste en extraer el máximo beneficio posible de sus recursos escasos; metafóricamente, se refiere al tamaño del pastel económico que puede producirse.',
      anidamiento: 'Hijo de: Economía. Par complementario con: Equidad.',
      tension: 'Eficiencia que maximiza producción total ↔ Equidad que distribuye justamente, ya que las políticas redistributivas tienden a reducir el pastel.',
      origen: 'Economía del bienestar, optimalidad de Pareto'
    },
    {
      concepto: 'Equidad',
      peso: 'importante',
      definicion: 'Propiedad que distribuye la riqueza económica de modo igualitario entre los miembros de la sociedad; metafóricamente, es cómo se reparten las porciones del pastel económico.',
      anidamiento: 'Hijo de: Economía. Par complementario con: Eficiencia.',
      tension: 'Equidad distributiva que iguala resultados ↔ Eficiencia productiva que maximiza output, tensión que obliga a toda sociedad a elegir un punto intermedio.',
      origen: 'Filosofía política, justicia distributiva (Rawls, Sen)'
    },
    {
      concepto: 'Costo de oportunidad',
      peso: 'critico',
      definicion: 'Aquello a lo que se renuncia para obtener algo; incluye no solo costos monetarios directos sino también el valor del tiempo y las alternativas sacrificadas, como el salario que un estudiante deja de percibir.',
      anidamiento: 'Hijo de: Escasez > Disyuntivas. Aplicado en: decisiones individuales, organizacionales y de política pública.',
      tension: 'Costo de oportunidad que incluye todo lo sacrificado ↔ Costo contable que solo registra desembolsos monetarios visibles, distinción que lleva a subestimar el costo real.',
      origen: 'Friedrich von Wieser (1914), economía austriaca'
    },
    {
      concepto: 'Personas racionales',
      peso: 'importante',
      definicion: 'Individuos que deliberada y sistemáticamente hacen todo lo posible por lograr sus objetivos, comparando costos y beneficios de cada acción; supuesto fundacional del análisis económico neoclásico.',
      anidamiento: 'Hijo de: Economía. Contiene: Cambios marginales, Incentivo.',
      tension: 'Racionalidad plena del homo economicus neoclásico ↔ Racionalidad limitada de Simon (1955) y sesgos cognitivos de Kahneman y Tversky.',
      origen: 'Economía neoclásica, homo economicus'
    },
    {
      concepto: 'Cambios marginales',
      peso: 'critico',
      definicion: 'Pequeños ajustes adicionales a un plan de acción que ya existe; las decisiones óptimas se toman comparando el beneficio marginal con el costo marginal de cada unidad adicional, no comparando totales.',
      anidamiento: 'Hijo de: Personas racionales. Aplicado en: paradoja agua-diamantes, decisión de la línea aérea.',
      tension: 'Pensamiento marginal con decisiones incrementales ↔ Pensamiento en promedios o totales que lleva a rechazar oportunidades rentables como vender el asiento a $300.',
      origen: 'Revolución marginalista (Jevons, Menger, Walras, 1870s)'
    },
    {
      concepto: 'Incentivo',
      peso: 'critico',
      definicion: 'Algo que induce a las personas a actuar, ya sea como recompensa o castigo; los incentivos alteran el cálculo costo-beneficio y modifican la conducta, incluso de formas no previstas por quienes diseñan políticas.',
      anidamiento: 'Hijo de: Personas racionales. Conecta con: Fallas del mercado, Política pública.',
      tension: 'Incentivos extrínsecos como recompensas y castigos económicos ↔ Motivación intrínseca que puede ser erosionada por incentivos monetarios (efecto crowding-out).',
      origen: 'Economía conductual, teoría de juegos'
    },
    {
      concepto: 'Economia de mercado',
      peso: 'critico',
      definicion: 'Sistema económico que asigna recursos mediante decisiones descentralizadas de millones de hogares y empresas, donde los precios y el interés personal orientan la coordinación sin planificación central.',
      anidamiento: 'Hijo de: Economía. Contiene: Derechos de propiedad, Falla del mercado. Opuesto a: Planificación central.',
      tension: 'Economía de mercado con coordinación descentralizada vía precios ↔ Planificación central con coordinación por el gobierno, cuyo fracaso histórico evidencia la superioridad informacional del mercado.',
      origen: 'Adam Smith (1776), La riqueza de las naciones'
    },
    {
      concepto: 'Derechos de propiedad',
      peso: 'importante',
      definicion: 'Habilidad que tienen las personas para ejercer propiedad y control sobre los recursos escasos; son la condición institucional necesaria para que la mano invisible funcione, sin ellos nadie tiene incentivo para producir.',
      anidamiento: 'Hijo de: Economía de mercado. Precondición de: funcionamiento de la mano invisible.',
      tension: 'Derechos de propiedad privada que incentivan producción individual ↔ Bienes comunales y tragedia de los comunes donde recursos sin dueño se sobreexplotan.',
      origen: 'John Locke, institucionalismo económico'
    },
    {
      concepto: 'Falla del mercado',
      peso: 'importante',
      definicion: 'Situación en la cual el mercado por sí solo no asigna los recursos de manera eficiente; las dos causas principales son las externalidades y el poder de mercado, y justifican la intervención gubernamental.',
      anidamiento: 'Hijo de: Economía de mercado. Contiene: Externalidad, Poder de mercado.',
      tension: 'Falla del mercado que justifica intervención gubernamental ↔ Falla del gobierno donde las políticas tampoco son perfectas por intereses políticos y limitaciones informacionales.',
      origen: 'Economía del bienestar, Pigou (1920)'
    },
    {
      concepto: 'Externalidad',
      peso: 'importante',
      definicion: 'Impacto que las acciones de una persona tienen sobre el bienestar de otra sin que medie compensación de mercado; la contaminación es el ejemplo clásico de externalidad negativa que el mercado no corrige solo.',
      anidamiento: 'Hijo de: Falla del mercado. Par con: Poder de mercado.',
      tension: 'Externalidades como costos o beneficios no compensados ↔ Internalización mediante impuestos pigouvianos o negociación coaseana que incorporan el costo externo al precio.',
      origen: 'Pigou (1920), Coase (1960)'
    },
    {
      concepto: 'Poder de mercado',
      peso: 'importante',
      definicion: 'Capacidad que tiene un solo actor económico o un grupo pequeño de influir considerablemente en los precios del mercado; el monopolio del único pozo de agua de un pueblo es el ejemplo paradigmático.',
      anidamiento: 'Hijo de: Falla del mercado. Par con: Externalidad.',
      tension: 'Poder de mercado donde un actor fija precios ↔ Competencia perfecta donde muchos actores impiden que ninguno influya en el precio.',
      origen: 'Economía industrial, teoría del monopolio'
    },
    {
      concepto: 'Productividad',
      peso: 'critico',
      definicion: 'Cantidad de bienes y servicios producidos por cada unidad de trabajo; es el determinante fundamental del nivel de vida de un país, superando en importancia a sindicatos, competencia internacional y políticas salariales.',
      anidamiento: 'Hijo de: Economía > Macroeconomía. Determinante de: nivel de vida, crecimiento económico.',
      tension: 'Productividad como causa del nivel de vida según Mankiw ↔ Distribución del ingreso como factor complementario, ya que los frutos de la productividad no siempre se reparten equitativamente.',
      origen: 'Economía clásica (Smith, Ricardo), teoría del crecimiento (Solow)'
    },
    {
      concepto: 'Inflacion',
      peso: 'importante',
      definicion: 'Incremento en el nivel general de los precios en la economía; en la mayoría de los casos de inflación alta y persistente, la causa es un aumento excesivo en la cantidad de dinero en circulación emitido por el gobierno.',
      anidamiento: 'Hijo de: Economía > Macroeconomía. Conecta con: Ciclo económico, Política monetaria.',
      tension: 'Inflación que erosiona poder adquisitivo y genera incertidumbre ↔ Deflación y estabilidad de precios como objetivo de bancos centrales, aunque un nivel muy bajo puede indicar estancamiento.',
      origen: 'Teoría cuantitativa del dinero, monetarismo (Friedman)'
    },
    {
      concepto: 'Ciclo economico',
      peso: 'importante',
      definicion: 'Fluctuaciones irregulares y en gran medida impredecibles de la actividad económica, medidas por la producción o el empleo; incluye fases de expansión, recesión y recuperación.',
      anidamiento: 'Hijo de: Economía > Macroeconomía. Conecta con: Inflación, Desempleo.',
      tension: 'Ciclo económico con fluctuaciones impredecibles inherentes al sistema ↔ Crecimiento estable como ideal teórico sin volatilidad, tensión que motiva la política contracíclica.',
      origen: 'Keynes (1936), Burns y Mitchell (1946)'
    }
  ],

  glosario_mapa: {
    anidamiento: [
      {concepto: 'Escasez', nivel: 0, hijos: ['Economia', 'Costo de oportunidad']},
      {concepto: 'Economia', nivel: 1, hijos: ['Eficiencia', 'Equidad', 'Personas racionales', 'Economia de mercado', 'Productividad', 'Inflacion', 'Ciclo economico']},
      {concepto: 'Personas racionales', nivel: 2, hijos: ['Cambios marginales', 'Incentivo']},
      {concepto: 'Cambios marginales', nivel: 3, hijos: []},
      {concepto: 'Incentivo', nivel: 3, hijos: []},
      {concepto: 'Economia de mercado', nivel: 2, hijos: ['Derechos de propiedad', 'Falla del mercado']},
      {concepto: 'Derechos de propiedad', nivel: 3, hijos: []},
      {concepto: 'Falla del mercado', nivel: 3, hijos: ['Externalidad', 'Poder de mercado']},
      {concepto: 'Externalidad', nivel: 4, hijos: []},
      {concepto: 'Poder de mercado', nivel: 4, hijos: []},
      {concepto: 'Eficiencia', nivel: 2, hijos: []},
      {concepto: 'Equidad', nivel: 2, hijos: []},
      {concepto: 'Costo de oportunidad', nivel: 1, hijos: []},
      {concepto: 'Productividad', nivel: 2, hijos: []},
      {concepto: 'Inflacion', nivel: 2, hijos: []},
      {concepto: 'Ciclo economico', nivel: 2, hijos: []}
    ],
    tensiones: [
      {par: 'Eficiencia ↔ Equidad', desc: 'Las políticas redistributivas agrandan las porciones iguales pero reducen el tamaño del pastel al disminuir incentivos al trabajo.'},
      {par: 'Economía de mercado ↔ Planificación central', desc: 'El mercado coordina vía precios con información distribuida; la planificación central carece de esa información y fracasó históricamente.'},
      {par: 'Costo de oportunidad ↔ Costo contable', desc: 'El costo de oportunidad incluye alternativas sacrificadas (tiempo, salario no percibido); el contable solo registra desembolsos monetarios.'},
      {par: 'Racionalidad plena ↔ Racionalidad limitada (Simon)', desc: 'Mankiw asume optimización deliberada; Simon y la economía conductual demuestran que las personas usan heurísticas y cometen sesgos.'},
      {par: 'Falla del mercado ↔ Falla del gobierno', desc: 'El mercado falla por externalidades y monopolios; pero el gobierno también falla por intereses políticos y falta de información.'},
      {par: 'Inflación ↔ Desempleo (corto plazo)', desc: 'A corto plazo, políticas que reducen desempleo tienden a aumentar inflación y viceversa; esta disyuntiva desaparece a largo plazo.'},
      {par: 'Poder de mercado ↔ Competencia perfecta', desc: 'El monopolista fija precios; en competencia perfecta ningún actor influye. La realidad está entre ambos extremos.'},
      {par: 'Externalidad ↔ Internalización', desc: 'Las externalidades son costos no compensados; la internalización (impuestos, regulación, negociación) busca incorporarlos al precio.'}
    ]
  },

  reflexiones: [
    {emoji: '📖', titulo: 'Primera impresión', hint: '¿Qué sentiste al terminar? ¿Te sorprendió algún principio? ¿La paradoja agua-diamantes o el efecto Peltzman desafiaron tu intuición?'},
    {emoji: '🔗', titulo: 'Conexiones con tu investigación doctoral', hint: '¿Cómo se relacionan los incentivos (P4), la productividad (P8) o las fallas de mercado (P7) con la adopción de IA/robotics/supercomputación en organizaciones?'},
    {emoji: '❓', titulo: 'Preguntas que genera', hint: '¿Los 10 principios son realmente universales o reflejan un sesgo neoclásico? ¿Qué pasa con el poder, las instituciones y la información asimétrica?'},
    {emoji: '📚', titulo: 'Textos a explorar', hint: 'Adam Smith (1776), Simon (1955) racionalidad limitada, Kahneman (2011) sesgos, Polanyi (1944) mercados incrustados, Keynes (1936), Peltzman (1975), Coase (1960)'},
    {emoji: '✅', titulo: 'Acciones concretas', hint: 'Pasos específicos: revisar cómo el costo de oportunidad aplica a tu caso de estudio, buscar datos de productividad en tu sector, etc.'},
    {emoji: '🔎', titulo: 'Dudas activas', hint: 'Dudas transferidas desde las marcas "?" durante la lectura anotada. ¿Qué conceptos necesitas profundizar?'},
    {emoji: '💬', titulo: 'Agenda para discusión', hint: 'Temas para llevar a tutoría o seminario: ¿el marco de Mankiw es útil para tu marco teórico doctoral o demasiado simplificado?'},
    {emoji: '📝', titulo: 'Notas libres', hint: 'Espacio abierto para lo que necesites registrar.'}
  ],

  mapa: {
    instruccion: 'Para cada texto que ya conozcas, decide si converge con, entra en tensión con, o abre preguntas respecto a Mankiw (2012).',
    converge: {
      titulo: '↔ Converge con',
      hint: 'Textos que comparten supuestos, conclusiones o marcos teóricos con este capítulo de Mankiw.'
    },
    tension: {
      titulo: '⇄ Entra en tensión con',
      hint: 'Textos que contradicen, matizan o desafían los supuestos de Mankiw (racionalidad, mano invisible, etc.).'
    },
    preguntas: {
      titulo: '→ Abre preguntas hacia',
      hint: 'Textos o líneas de investigación que los 10 principios sugieren explorar.'
    },
    preguntas_iniciales: [
      '¿Hasta qué punto los 10 principios de Mankiw son universales o reflejan la perspectiva específica del nuevo keynesianismo de Harvard, y cómo cambiarían si incorporaran las aportaciones de la economía conductual (Kahneman y Tversky)?',
      '¿Puede el marco de Mankiw dar cuenta de fenómenos contemporáneos como la concentración tecnológica en IA, la economía de plataformas y las externalidades algorítmicas?'
    ]
  }
};