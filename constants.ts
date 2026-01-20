
export const ANALYSIS_STEP_TITLES_ES = [
  "1. Comprensión léxica",
  "2. Localizar Verbos",
  "3. Identificar Nexos",
  "4. Delimitar Proposiciones",
  "5. Sujeto y Predicado",
  "6. Categoría del nexo",
  "7. Clasificación general",
  "8. Tipo específico",
  "9. Función sintáctica",
  "Análisis Finalizado",
];

export const ANALYSIS_STEP_TITLES_NL = [
  "1. Begrip van de zin",
  "2. Werkwoorden zoeken",
  "3. Verbindingswoorden",
  "4. Verdeel in deelzinnen",
  "5. Analyse hoofdzin",
  "6. Categorie voegwoord",
  "7. Algemene classificatie",
  "8. Specifiek type",
  "9. Syntactische functie",
  "Analyse voltooid",
];

const RAW_SENTENCES_ES = {
  yuxtapuesta: [
    "Vine, vi, vencí.", "Llegué tarde, el jefe estaba enfadado.", "Unos ríen, otros lloran.", "Estudió mucho, aprobó todo.", "Hace sol, saldré a caminar.",
    "No vino nadie; el local estaba vacío.", "Unos comen fruta, otros prefieren dulce.", "Trabaja duro, descansa poco.", "Llegó, saludó, se fue.", "La lluvia caía, el viento soplaba."
  ],
  coordinada: [
    "Juan estudia Derecho y Ana trabaja en una farmacia.", "Jugamos muy bien pero perdimos el partido.",
    "O vienes o te quedas.", "Unos jugáis al fútbol, otros hacéis tareas.", "Le hizo un quite, esto es, se llevó el toro.",
    "Ni come ni deja comer.", "Estudia mucho, o sea, es muy responsable.", "Es una película larga, sin embargo es entretenida.", "O bien lo dices ahora, o bien guardas silencio.", "Llegaron los invitados e iniciamos la cena."
  ],
  sustantiva: [
    "Me preocupa que estudies mucho.", "Andrés piensa que Carlos tenía razón.", "Tenemos el convencimiento de que te presentarás.",
    "Dime si vendrás mañana.", "Es necesario que comas bien.", "Espero que no te moleste mi opinión.", "Me alegra verte tan feliz.", "No creo que sea la mejor solución.", "El profesor mandó que saliéramos.", "Le gusta que le digan la verdad."
  ],
  adjetiva: [
    "El hombre que está sentado es su padre.", "El jugador, que estaba cansado, se marchó.",
    "La casa donde vivo es pequeña.", "El libro cuyo autor conoces es bueno.", "Las personas a quienes llamaste no contestan.", "El coche que compraste corre mucho.", "Vimos el pueblo por donde pasaste.", "Esa es la razón por la cual no vine.", "Aquellos que no estudien no aprobarán.", "Buscamos un traductor que sepa alemán."
  ],
  adverbial_propia: [
    "Siéntate cuando quieras.", "Siéntate donde quieras.", "Siéntate como quieras.", "Lo hice según me dijiste.", "Iré adonde me digas.", "Estaremos allí mientras dure el concierto.", "Salió antes de que amaneciera.", "Hazlo como mejor te parezca.", "Vive donde vive el olvido.", "Llegamos apenas terminó la película."
  ],
  adverbial_impropia: [
    "Es más listo que Javier.", "Me voy porque llueve.", "Pienso, luego existo.", "Gané aunque fui enfermo.", "Me quedaré si me ayudas.", "Jugaré para divertirnos.",
    "Como no vengas, me enfado.", "Tan pronto como llegues, llámame.", "Puesto que no estás de acuerdo, lo haremos así.", "Habla de modo que todos lo entiendan."
  ]
};

const RAW_SENTENCES_NL = {
  yuxtapuesta: [
    "Ik kwam, ik zag, ik overwon.", "Het regent, ik blijf binnen.", "Sommigen lachen, anderen huilen.", "Hij werkte hard, hij slaagde voor alles.", "De zon schijnt, we gaan wandelen.",
    "Niemand kwam; de zaal was leeg.", "De een eet fruit, de ander snoept liever.", "Werk hard, rust weinig.", "Hij kwam binnen, groette, vertrok weer.", "De regen viel, de wind waaide."
  ],
  coordinada: [
    "Jan studeert rechten en Anna werkt in een apotheek.", "We speelden goed maar we verloren de wedstrijd.",
    "Of je komt, of je blijft thuis.", "Ik wil gaan, want het is al laat.", "Hij is ziek, dus hij komt niet naar school.",
    "Hij drinkt geen koffie, noch drinkt hij thee.", "Het is een lange film, toch is hij vermakelijk.", "Zij zingt prachtig en hij speelt piano.", "Je moet nu beslissen, anders is het te laat.", "De gasten kwamen aan en het diner begon."
  ],
  sustantiva: [
    "Ik vind het belangrijk dat je studeert.", "Andreas denkt dat Carlos gelijk had.", "Ik weet niet of hij morgen komt.",
    "Het is nodig dat je goed eet.", "Ik hoop dat je mijn mening niet erg vindt.", "Het verbaast me dat zij dat zegt.", "Zij vertelde dat ze op vakantie gaat.", "Ik begrijp waarom je boos bent.", "De leraar vroeg of we wilden luisteren.", "Het is fijn dat je er bent."
  ],
  adjetiva: [
    "De man die daar zit, is mijn vader.", "De speler die moe was, ging weg.",
    "Het huis waar ik woon, is klein.", "Het boek waarvan je de auteur kent, is goed.", "De mensen die je belde, nemen niet op.", "De auto die je kocht, rijdt erg hard.", "Dat is de reden waarom ik niet kwam.", "De studenten die niet studeren, zakken.", "We zoeken een vertaler die Duits spreekt.", "De film die we gister zagen, was spannend."
  ],
  adverbial_propia: [
    "Ga zitten wanneer je wilt.", "Blijf waar je bent.", "Doe het zoals ik het zei.", "Ik ga waarheen je me stuurt.", "We blijven daar zolang het concert duurt.", "Hij vertrok voordat de zon opkwam.", "Nadat het was gestopt met regenen, gingen we naar buiten.", "Terwijl hij las, luisterde hij naar muziek.", "Sinds zij hier woont, is ze gelukkiger.", "Zodra de les begint, moet je stil zijn."
  ],
  adverbial_impropia: [
    "Hij is slimmer dan Javier.", "Ik ga weg omdat het regent.", "Ik denk, dus ik ben.", "Ik won hoewel ik ziek was.", "Ik blijf als je me helpt.", "Ik speel om plezier te hebben.",
    "Aangezien je het er niet mee eens bent, doen we het zo.", "Zelfs als het sneeuwt, gaan we door.", "Hij spreekt zo dat iedereen hem verstaat.", "Mits je op tijd bent, mag je mee."
  ]
};

export const getShuffledPractice = (language: 'es' | 'nl' = 'es') => {
  const source = language === 'nl' ? RAW_SENTENCES_NL : RAW_SENTENCES_ES;
  
  const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const categories = [
    { id: 'yuxt', label: language === 'nl' ? 'Nevenschikkend (zonder vgw)' : 'Yuxtapuestas', data: source.yuxtapuesta },
    { id: 'coord', label: language === 'nl' ? 'Nevenschikkend (met vgw)' : 'Coordinadas', data: source.coordinada },
    { id: 'sust', label: language === 'nl' ? 'Onderschikkend (inhoud)' : 'Sub. Sustantivas', data: source.sustantiva },
    { id: 'adj', label: language === 'nl' ? 'Betrekkelijke bijzinnen' : 'Sub. Adjetivas', data: source.adjetiva },
    { id: 'advp', label: language === 'nl' ? 'Bijwoorden (tijd/plaats)' : 'Adverbiales Propias', data: source.adverbial_propia },
    { id: 'advi', label: language === 'nl' ? 'Bijwoorden (reden/voorw)' : 'Adverbiales Impropias', data: source.adverbial_impropia }
  ];

  const shuffledCategories = categories.sort(() => Math.random() - 0.5);

  return shuffledCategories.map(cat => ({
    id: cat.id,
    label: cat.label,
    sentences: shuffle(cat.data).slice(0, 3)
  }));
};

export const GLOSSARY_ES: Record<string, string> = {
  'SN-Sujeto': 'Sujeto: Persona o cosa que realiza la acción.',
  'SV-PV': 'Predicado: Lo que se dice del sujeto.',
  'VERBO': 'Núcleo: Indica la acción principal.',
  'NEXO': 'Elemento que une dos proposiciones.',
};

export const GLOSSARY_NL: Record<string, string> = {
  'SN-Sujeto': 'Onderwerp: Wie doet het?',
  'SV-PV': 'Gezegde: Wat gebeurt er?',
};
