export const menuSections = [
  {
    id: 'tacos',
    title: 'Tacos Estrella',
    description: 'Recetas clásicas con tortilla de maíz recién hecha y salsas artesanales.',
    items: [
      {
        id: 'taco-pastor',
        name: 'Taco al Pastor',
        price: 1800,
        description: 'Cerdo marinado, piña caramelizada, cebolla morada y cilantro fresco.',
        spicy: true,
        recommended: true
      },
      {
        id: 'taco-birria',
        name: 'Taco de Birria',
        price: 2000,
        description: 'Res braseada 12 horas, consomé ahumado y queso fundido.',
        spicy: false,
        recommended: true
      },
      {
        id: 'taco-veggie',
        name: 'Taco Veggie Verde',
        price: 1700,
        description: 'Calabacín grillado, portobello, aguacate y salsa verde de la casa.',
        spicy: false,
        recommended: false
      }
    ]
  },
  {
    id: 'especiales',
    title: 'Especialidades de la Casa',
    description: 'Platos contundentes para compartir o disfrutar solo.',
    items: [
      {
        id: 'wrap-mostaza',
        name: 'Wrap Mostaza Miel',
        price: 3500,
        description: 'Pollo crocante, ensalada de col, pepinillos y salsa honey mustard.',
        spicy: false,
        recommended: false
      },
      {
        id: 'wrap-bbq',
        name: 'Wrap BBQ',
        price: 3500,
        description: 'Costillas desmenuzadas, cebolla caramelizada y salsa BBQ ahumada.',
        spicy: false,
        recommended: true
      },
      {
        id: 'burger-king',
        name: 'Crunchy King Burger',
        price: 4200,
        description: 'Doble carne, queso cheddar, crujientes de maíz y alioli de chipotle.',
        spicy: true,
        recommended: false
      }
    ]
  },
  {
    id: 'bebidas',
    title: 'Bebidas & Extras',
    description: 'Acompañantes frescos para completar la experiencia.',
    items: [
      {
        id: 'agua-fresca',
        name: 'Agua Fresca del Día',
        price: 900,
        description: 'Rotación de sabores naturales: tamarindo, horchata, jamaica o maracuyá.',
        spicy: false,
        recommended: false
      },
      {
        id: 'papas',
        name: 'Papas Rebozadas',
        price: 1500,
        description: 'Servidas con salsa cremosa de cilantro y lima.',
        spicy: false,
        recommended: false
      },
      {
        id: 'churros',
        name: 'Churros con Cajeta',
        price: 1600,
        description: 'Azúcar de canela, cajeta tibia y ralladura de naranja.',
        spicy: false,
        recommended: true
      }
    ]
  }
]
