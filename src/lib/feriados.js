/**
 * Calcula os feriados brasileiros (fixos e móveis) para um determinado ano
 */

// Função para calcular a Páscoa (algoritmo de Meeus/Jones/Butcher)
function calcularPascoal(ano) {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  
  return new Date(ano, mes - 1, dia)
}

// Função para adicionar dias a uma data
function adicionarDias(data, dias) {
  const novaData = new Date(data)
  novaData.setDate(novaData.getDate() + dias)
  return novaData
}

/**
 * Retorna todos os feriados brasileiros para um determinado ano
 * @param {number} ano - Ano para calcular os feriados
 * @returns {Array} Array de objetos com { data, nome, tipo }
 */
export function getFeriadosBrasileiros(ano = new Date().getFullYear()) {
  const feriados = []

  // Feriados fixos
  const feriadosFixos = [
    { dia: 1, mes: 0, nome: 'Ano Novo', tipo: 'nacional' },
    { dia: 21, mes: 3, nome: 'Tiradentes', tipo: 'nacional' },
    { dia: 1, mes: 4, nome: 'Dia do Trabalhador', tipo: 'nacional' },
    { dia: 7, mes: 8, nome: 'Independência do Brasil', tipo: 'nacional' },
    { dia: 12, mes: 9, nome: 'Nossa Senhora Aparecida', tipo: 'nacional' },
    { dia: 2, mes: 10, nome: 'Finados', tipo: 'nacional' },
    { dia: 15, mes: 10, nome: 'Proclamação da República', tipo: 'nacional' },
    { dia: 25, mes: 11, nome: 'Natal', tipo: 'nacional' },
  ]

  feriadosFixos.forEach(feriado => {
    feriados.push({
      data: new Date(ano, feriado.mes, feriado.dia),
      nome: feriado.nome,
      tipo: feriado.tipo,
    })
  })

  // Calcular feriados móveis baseados na Páscoa
  const pascoal = calcularPascoal(ano)
  
  // Carnaval (segunda e terça-feira antes da quarta-feira de cinzas)
  const quartaCinzas = adicionarDias(pascoal, -46) // 46 dias antes da Páscoa
  const tercaCarnaval = adicionarDias(quartaCinzas, -1)
  const segundaCarnaval = adicionarDias(quartaCinzas, -2)
  
  feriados.push({
    data: segundaCarnaval,
    nome: 'Carnaval (Segunda-feira)',
    tipo: 'nacional',
  })
  
  feriados.push({
    data: tercaCarnaval,
    nome: 'Carnaval (Terça-feira)',
    tipo: 'nacional',
  })

  // Sexta-feira Santa
  const sextaSanta = adicionarDias(pascoal, -2)
  feriados.push({
    data: sextaSanta,
    nome: 'Sexta-feira Santa',
    tipo: 'nacional',
  })

  // Páscoa (não é feriado nacional, mas pode ser útil mostrar)
  // feriados.push({
  //   data: pascoal,
  //   nome: 'Páscoa',
  //   tipo: 'nacional',
  // })

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = adicionarDias(pascoal, 60)
  feriados.push({
    data: corpusChristi,
    nome: 'Corpus Christi',
    tipo: 'nacional',
  })

  // Ordenar por data
  feriados.sort((a, b) => a.data - b.data)

  return feriados
}

/**
 * Retorna os feriados para um intervalo de datas
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {Array} Array de objetos com { data, nome, tipo }
 */
export function getFeriadosNoIntervalo(startDate, endDate) {
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const feriados = []

  // Buscar feriados para cada ano no intervalo
  for (let ano = startYear; ano <= endYear; ano++) {
    const feriadosAno = getFeriadosBrasileiros(ano)
    feriados.push(...feriadosAno)
  }

  // Filtrar apenas os feriados dentro do intervalo
  return feriados.filter(feriado => {
    const dataFeriado = new Date(feriado.data)
    dataFeriado.setHours(0, 0, 0, 0)
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    
    return dataFeriado >= start && dataFeriado <= end
  })
}
