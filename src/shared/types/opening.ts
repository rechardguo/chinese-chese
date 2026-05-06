export interface OpeningMove {
  iccs: string
  notation: string
  comment: string
}

export interface Opening {
  id: string
  name: string
  nameEn?: string
  description: string
  fen?: string
  evaluation?: string
  moves?: OpeningMove[]
  children?: Opening[]
}

export interface OpeningCategory {
  id: string
  name: string
  nameEn: string
  description: string
  children: Opening[]
}
