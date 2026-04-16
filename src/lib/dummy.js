// Dummy data for UI development — replace with real Supabase data before tournament

export const DUMMY_COUPLES = [
  // ── DIAMANT ──────────────────────────────────────────────────────────────
  { id: 'd-g1-1', division: 'diamant', group_code: 'G1', seed: 1, player_1_name: 'Alejandro García',    player_2_name: 'Miguel Fernández',   team_name: 'García / Fernández' },
  { id: 'd-g1-2', division: 'diamant', group_code: 'G1', seed: 2, player_1_name: 'Carlos López',         player_2_name: 'Antonio Martínez',   team_name: 'López / Martínez' },
  { id: 'd-g1-3', division: 'diamant', group_code: 'G1', seed: 3, player_1_name: 'Javier Sánchez',       player_2_name: 'Roberto Pérez',      team_name: 'Sánchez / Pérez' },
  { id: 'd-g1-4', division: 'diamant', group_code: 'G1', seed: 4, player_1_name: 'Diego González',       player_2_name: 'Sergio Rodríguez',   team_name: 'González / Rodríguez' },

  { id: 'd-g2-1', division: 'diamant', group_code: 'G2', seed: 1, player_1_name: 'Fernando Torres',      player_2_name: 'Eduardo Ramírez',    team_name: 'Torres / Ramírez' },
  { id: 'd-g2-2', division: 'diamant', group_code: 'G2', seed: 2, player_1_name: 'Álvaro Morales',       player_2_name: 'Ricardo Jiménez',    team_name: 'Morales / Jiménez' },
  { id: 'd-g2-3', division: 'diamant', group_code: 'G2', seed: 3, player_1_name: 'Marcos Álvarez',       player_2_name: 'Víctor Romero',      team_name: 'Álvarez / Romero' },
  { id: 'd-g2-4', division: 'diamant', group_code: 'G2', seed: 4, player_1_name: 'Enrique Alonso',       player_2_name: 'Manuel Gutiérrez',   team_name: 'Alonso / Gutiérrez' },

  { id: 'd-g3-1', division: 'diamant', group_code: 'G3', seed: 1, player_1_name: 'José Navarro',         player_2_name: 'Raúl Serrano',       team_name: 'Navarro / Serrano' },
  { id: 'd-g3-2', division: 'diamant', group_code: 'G3', seed: 2, player_1_name: 'Andrés Molina',        player_2_name: 'Daniel Castro',      team_name: 'Molina / Castro' },
  { id: 'd-g3-3', division: 'diamant', group_code: 'G3', seed: 3, player_1_name: 'Pablo Ruiz',           player_2_name: 'Ignacio Ortiz',      team_name: 'Ruiz / Ortiz' },
  { id: 'd-g3-4', division: 'diamant', group_code: 'G3', seed: 4, player_1_name: 'Jaime de la Vega',     player_2_name: 'Tomás del Río',      team_name: 'de la Vega / del Río' },

  // ── OR ───────────────────────────────────────────────────────────────────
  { id: 'o-g1-1', division: 'or', group_code: 'G1', seed: 1, player_1_name: 'Luis Blanco',          player_2_name: 'David Delgado',       team_name: 'Blanco / Delgado' },
  { id: 'o-g1-2', division: 'or', group_code: 'G1', seed: 2, player_1_name: 'Juan Moreno',          player_2_name: 'Pedro Medina',        team_name: 'Moreno / Medina' },
  { id: 'o-g1-3', division: 'or', group_code: 'G1', seed: 3, player_1_name: 'Guillermo Vidal',      player_2_name: 'Héctor Iglesias',     team_name: 'Vidal / Iglesias' },
  { id: 'o-g1-4', division: 'or', group_code: 'G1', seed: 4, player_1_name: 'Nicolás Santos',       player_2_name: 'Germán Cortés',       team_name: 'Santos / Cortés' },

  { id: 'o-g2-1', division: 'or', group_code: 'G2', seed: 1, player_1_name: 'Emilio de la Cruz',    player_2_name: 'Rodrigo Fuentes',     team_name: 'de la Cruz / Fuentes' },
  { id: 'o-g2-2', division: 'or', group_code: 'G2', seed: 2, player_1_name: 'Sebastián Herrero',    player_2_name: 'Adrián Prieto',       team_name: 'Herrero / Prieto' },
  { id: 'o-g2-3', division: 'or', group_code: 'G2', seed: 3, player_1_name: 'Hugo Cano',            player_2_name: 'Iván Rubio',          team_name: 'Cano / Rubio' },
  { id: 'o-g2-4', division: 'or', group_code: 'G2', seed: 4, player_1_name: 'Óscar Moya',           player_2_name: 'Kevin Vargas',        team_name: 'Moya / Vargas' },

  { id: 'o-g3-1', division: 'or', group_code: 'G3', seed: 1, player_1_name: 'Borja Lara',           player_2_name: 'Cristian Campos',     team_name: 'Lara / Campos' },
  { id: 'o-g3-2', division: 'or', group_code: 'G3', seed: 2, player_1_name: 'Unai Guerrero',        player_2_name: 'Mikel Ibáñez',        team_name: 'Guerrero / Ibáñez' },
  { id: 'o-g3-3', division: 'or', group_code: 'G3', seed: 3, player_1_name: 'Alberto Parra',        player_2_name: 'Samuel Gallego',      team_name: 'Parra / Gallego' },
  { id: 'o-g3-4', division: 'or', group_code: 'G3', seed: 4, player_1_name: 'Lucas de los Reyes',   player_2_name: 'Martín Ferrer',       team_name: 'de los Reyes / Ferrer' },

  { id: 'o-g4-1', division: 'or', group_code: 'G4', seed: 1, player_1_name: 'Gonzalo Ramos',        player_2_name: 'Rubén Nieto',         team_name: 'Ramos / Nieto' },
  { id: 'o-g4-2', division: 'or', group_code: 'G4', seed: 2, player_1_name: 'Mateo Aguilar',        player_2_name: 'Nicolás Pascual',     team_name: 'Aguilar / Pascual' },
  { id: 'o-g4-3', division: 'or', group_code: 'G4', seed: 3, player_1_name: 'César Domínguez',      player_2_name: 'Víctor Peña',         team_name: 'Domínguez / Peña' },
  { id: 'o-g4-4', division: 'or', group_code: 'G4', seed: 4, player_1_name: 'Ignacio Calvo',        player_2_name: 'Felipe Hidalgo',      team_name: 'Calvo / Hidalgo' },

  { id: 'o-g5-1', division: 'or', group_code: 'G5', seed: 1, player_1_name: 'Rodrigo Giménez',      player_2_name: 'Pablo Soler',         team_name: 'Giménez / Soler' },
  { id: 'o-g5-2', division: 'or', group_code: 'G5', seed: 2, player_1_name: 'Alejandro Montoya',    player_2_name: 'Fernando Vera',       team_name: 'Montoya / Vera' },
  { id: 'o-g5-3', division: 'or', group_code: 'G5', seed: 3, player_1_name: 'Antonio Castillo',     player_2_name: 'Carlos Lozano',       team_name: 'Castillo / Lozano' },
  { id: 'o-g5-4', division: 'or', group_code: 'G5', seed: 4, player_1_name: 'Roberto Bravo',        player_2_name: 'Diego Rivas',         team_name: 'Bravo / Rivas' },

  { id: 'o-g6-1', division: 'or', group_code: 'G6', seed: 1, player_1_name: 'Manuel Heredia',       player_2_name: 'Sergio Valdés',       team_name: 'Heredia / Valdés' },
  { id: 'o-g6-2', division: 'or', group_code: 'G6', seed: 2, player_1_name: 'Leandro Espinosa',     player_2_name: 'Patricio Mora',       team_name: 'Espinosa / Mora' },
  { id: 'o-g6-3', division: 'or', group_code: 'G6', seed: 3, player_1_name: 'Alfredo Salinas',      player_2_name: 'Lorenzo Benítez',     team_name: 'Salinas / Benítez' },
  { id: 'o-g6-4', division: 'or', group_code: 'G6', seed: 4, player_1_name: 'Esteban de la Torre',  player_2_name: 'Arturo Crespo',       team_name: 'de la Torre / Crespo' },

  // ── PLATA ────────────────────────────────────────────────────────────────
  { id: 'p-g1-1', division: 'plata', group_code: 'G1', seed: 1, player_1_name: 'Joel Montes',          player_2_name: 'Ismael Carrasco',   team_name: 'Montes / Carrasco' },
  { id: 'p-g1-2', division: 'plata', group_code: 'G1', seed: 2, player_1_name: 'Mario Perales',         player_2_name: 'Rafael Tapia',      team_name: 'Perales / Tapia' },
  { id: 'p-g1-3', division: 'plata', group_code: 'G1', seed: 3, player_1_name: 'Antonio Gallardo',      player_2_name: 'Luis Espejo',       team_name: 'Gallardo / Espejo' },
  { id: 'p-g1-4', division: 'plata', group_code: 'G1', seed: 4, player_1_name: 'Ramón de la Fuente',    player_2_name: 'Aurelio Villanueva',team_name: 'de la Fuente / Villanueva' },

  { id: 'p-g2-1', division: 'plata', group_code: 'G2', seed: 1, player_1_name: 'Joaquín Montero',       player_2_name: 'Cristóbal Aranda',  team_name: 'Montero / Aranda' },
  { id: 'p-g2-2', division: 'plata', group_code: 'G2', seed: 2, player_1_name: 'Bernardo Ibarra',        player_2_name: 'Valentín Esquivel', team_name: 'Ibarra / Esquivel' },
  { id: 'p-g2-3', division: 'plata', group_code: 'G2', seed: 3, player_1_name: 'Rafael Palomino',        player_2_name: 'Sergio de la Rosa', team_name: 'Palomino / de la Rosa' },
  { id: 'p-g2-4', division: 'plata', group_code: 'G2', seed: 4, player_1_name: 'Carlos Quirós',          player_2_name: 'Germán Nava',       team_name: 'Quirós / Nava' },

  { id: 'p-g3-1', division: 'plata', group_code: 'G3', seed: 1, player_1_name: 'Ernesto Cabello',        player_2_name: 'Mauricio Pinto',    team_name: 'Cabello / Pinto' },
  { id: 'p-g3-2', division: 'plata', group_code: 'G3', seed: 2, player_1_name: 'Leopoldo Ríos',          player_2_name: 'Gustavo Paredes',   team_name: 'Ríos / Paredes' },
  { id: 'p-g3-3', division: 'plata', group_code: 'G3', seed: 3, player_1_name: 'Francisco Serantes',     player_2_name: 'Rodrigo Toro',      team_name: 'Serantes / Toro' },
  { id: 'p-g3-4', division: 'plata', group_code: 'G3', seed: 4, player_1_name: 'Pablo del Valle',        player_2_name: 'Rubén Mata',        team_name: 'del Valle / Mata' },
]

// Returns standings rows for a group with all stats at zero (pre-tournament)
export function getDummyStandings(division, groupCode) {
  return DUMMY_COUPLES
    .filter(c => c.division === division && c.group_code === groupCode)
    .sort((a, b) => a.seed - b.seed)
    .map(c => ({
      couple_id: c.id,
      couple: c,
      matches_played: 0,
      matches_won: 0,
      matches_lost: 0,
      games_for: 0,
      games_against: 0,
      game_differential: 0,
      points: 0,
      rank: c.seed,
    }))
}

// Knockout bracket structure — all slots TBD pre-group phase
export const KNOCKOUT_STRUCTURE = {
  diamant: {
    main: [
      {
        round: 'quarter', slots: [
          { label: 'A1', side_a: '1º G1', side_b: '2º G3' },
          { label: 'A2', side_a: '1º G2', side_b: 'Mejor 3º' },
          { label: 'A3', side_a: '1º G3', side_b: '2º Mejor 3º' },
          { label: 'A4', side_a: '2º G1', side_b: '2º G2' },
        ],
      },
      {
        round: 'semi', slots: [
          { label: 'S1', side_a: 'Gan. A1', side_b: 'Gan. A2' },
          { label: 'S2', side_a: 'Gan. A3', side_b: 'Gan. A4' },
        ],
      },
      {
        round: 'final', slots: [
          { label: 'Final', side_a: 'Gan. S1', side_b: 'Gan. S2' },
          { label: '3º/4º', side_a: 'Per. S1', side_b: 'Per. S2' },
        ],
      },
    ],
    consolation: [
      { label: 'C1', side_a: '3er Mejor 3º', side_b: '4º G1' },
      { label: 'C2', side_a: '4º G2',         side_b: '4º G3' },
    ],
  },
  or: {
    main: [
      {
        round: 'quarter', slots: [
          { label: 'A1', side_a: '1º G1', side_b: 'Mejor 2º' },
          { label: 'A2', side_a: '1º G2', side_b: '2º Mejor 2º' },
          { label: 'A3', side_a: '1º G3', side_b: '1º G4' },
          { label: 'A4', side_a: '1º G5', side_b: '3er Mejor 2º' },
        ],
      },
      {
        round: 'semi', slots: [
          { label: 'S1', side_a: 'Gan. A1', side_b: 'Gan. A2' },
          { label: 'S2', side_a: 'Gan. A3', side_b: 'Gan. A4' },
        ],
      },
      {
        round: 'final', slots: [
          { label: 'Final', side_a: 'Gan. S1', side_b: 'Gan. S2' },
          { label: '3º/4º', side_a: 'Per. S1', side_b: 'Per. S2' },
        ],
      },
    ],
    consolation: [
      { label: 'C1 (2º)', side_a: '4º Mejor 2º', side_b: '5º Mejor 2º' },
      { label: 'C2 (3º)', side_a: 'Mejor 3º',    side_b: '2º Mejor 3º' },
      { label: 'C3 (3º)', side_a: '3er Mejor 3º', side_b: '4º Mejor 3º' },
      { label: 'C4 (4º)', side_a: 'Mejor 4º',    side_b: '2º Mejor 4º' },
      { label: 'C5 (4º)', side_a: '3er Mejor 4º', side_b: '4º Mejor 4º' },
    ],
  },
  plata: {
    main: [
      {
        round: 'semi', slots: [
          { label: 'S1', side_a: '1º G1', side_b: '1º G2' },
          { label: 'S2', side_a: '1º G3', side_b: 'Mejor 2º' },
        ],
      },
      {
        round: 'final', slots: [
          { label: 'Final', side_a: 'Gan. S1', side_b: 'Gan. S2' },
          { label: '3º/4º', side_a: 'Per. S1', side_b: 'Per. S2' },
        ],
      },
    ],
    consolation: [
      { label: 'C1 (2º)', side_a: '2º 2º',   side_b: '3er 2º' },
      { label: 'C2 (3º)', side_a: 'Mejor 3º', side_b: '2º 3º' },
      { label: 'C3 (3º)', side_a: '3er 3º',   side_b: '4º G1' },
      { label: 'C4 (4º)', side_a: '4º G2',    side_b: '4º G3' },
    ],
  },
}
