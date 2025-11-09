export function getTempoMarking(bpm) {
  if (bpm < 60) return 'Largo'
  if (bpm < 76) return 'Adagio'
  if (bpm < 108) return 'Andante'
  if (bpm < 120) return 'Moderato'
  if (bpm < 168) return 'Allegro'
  if (bpm < 200) return 'Presto'
  return 'Prestissimo'
}

