import Papa from 'papaparse';

const PORTUGUESE_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Auxiliar para limpar e converter número de moeda (£2.50 ou $1.50 -> 2.50)
function parseCurrencyString(val) {
  if (!val) return 0;
  // Limpa símbolos comuns
  const clean = val.replace(/[£$Â\s]/g, '').trim();
  if (!clean) return 0;
  // Converte , para . caso haja
  const parsed = parseFloat(clean.replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

// Auxiliar para obter a moeda
function detectCurrency(val) {
  if (!val) return 'GBP';
  if (val.includes('$')) return 'USD';
  if (val.includes('£')) return 'GBP';
  return 'GBP'; // Fallback padrão
}

// Auxiliar para converter data
function parseDateTime(val) {
  if (!val) return null;
  const t = val.trim();
  if (!t) return null;

  // Tenta criar diretamente
  let date = new Date(t);
  if (!isNaN(date.getTime())) return date;

  // Tenta tratar formato YYYY-MM-DD HH:mm:ss.SSSSSS
  const normalized = t.replace(' ', 'T');
  date = new Date(normalized);
  if (!isNaN(date.getTime())) return date;

  // Fallback para split manual
  try {
    const parts = t.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00';
    
    const dateSplit = datePart.split('-');
    const timeClean = timePart.split('.')[0]; // remove frações de segundo
    const timeSplit = timeClean.split(':');

    const year = parseInt(dateSplit[0], 10);
    const month = parseInt(dateSplit[1], 10) - 1; // 0-indexed
    const day = parseInt(dateSplit[2], 10);
    
    const hour = parseInt(timeSplit[0] || '0', 10);
    const minute = parseInt(timeSplit[1] || '0', 10);
    const second = parseInt(timeSplit[2] || '0', 10);

    const builtDate = new Date(year, month, day, hour, minute, second);
    return isNaN(builtDate.getTime()) ? null : builtDate;
  } catch (e) {
    return null;
  }
}

export function parseProlificCSV(csvText, rates = { usd: 4.9128, gbp: 6.6638 }, taxes = { spread: 0, iof: 0 }) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rawRows = parsed.data;
  const processedRows = [];

  rawRows.forEach((row) => {
    // Valida colunas essenciais
    if (!row.Study && !row.Status) return;

    const rewardStr = row.Reward || '';
    const bonusStr = row.Bonus || '';

    const moeda = detectCurrency(rewardStr);
    const rewardNumeric = parseCurrencyString(rewardStr);
    const bonusNumeric = parseCurrencyString(bonusStr);
    const valorTotalOriginal = rewardNumeric + bonusNumeric;

    // Conversão para BRL
    let valorTotalBRLBruto = 0;
    if (moeda === 'USD') {
      valorTotalBRLBruto = valorTotalOriginal * rates.usd;
    } else {
      valorTotalBRLBruto = valorTotalOriginal * rates.gbp;
    }

    // Aplicar taxas (Spread + IOF) para obter a Liquidez Real
    const spreadDesconto = valorTotalBRLBruto * ((taxes.spread || 0) / 100);
    const iofDesconto = valorTotalBRLBruto * ((taxes.iof || 0) / 100);
    const valorTotalBRL = Math.max(0, valorTotalBRLBruto - spreadDesconto - iofDesconto);

    const startedAt = parseDateTime(row['Started At']);
    const completedAt = parseDateTime(row['Completed At']);

    // Status Resumo
    const status = (row.Status || '').toUpperCase().trim();
    let statusResumo = 'Outro';
    if (status === 'APPROVED') {
      statusResumo = 'Aprovado';
    } else if (status === 'AWAITING REVIEW') {
      statusResumo = 'Em review';
    } else if (status === 'REJECTED') {
      statusResumo = 'Rejeitado';
    } else if (['RETURNED', 'SCREENED OUT', 'TIMED-OUT'].includes(status)) {
      statusResumo = 'Retornado';
    }

    // Datas calculadas
    let dataConclusaoDiaStr = null;
    let mesAnoStr = null;
    let anoMesOrdem = null;
    let diaSemanaStr = null;
    let diaSemanaOrdem = null;
    let duracaoMinutos = null;
    let horaInicio = null;
    let faixaHoraria = null;

    if (startedAt) {
      horaInicio = startedAt.getHours();
      faixaHoraria = `${String(horaInicio).padStart(2, '0')}:00`;
    }

    if (completedAt) {
      // YYYY-MM-DD
      const year = completedAt.getFullYear();
      const month = completedAt.getMonth(); // 0-11
      const day = completedAt.getDate();
      
      dataConclusaoDiaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Mês/Ano (ex: mai/26)
      mesAnoStr = `${PORTUGUESE_MONTHS[month]}/${String(year).slice(-2)}`;
      anoMesOrdem = year * 100 + (month + 1);

      // Dia da semana (Seg=1, ..., Dom=7)
      // getDay() retorna Dom=0, Seg=1, Ter=2, ..., Sáb=6
      const jsDay = completedAt.getDay();
      diaSemanaOrdem = jsDay === 0 ? 7 : jsDay;
      diaSemanaStr = WEEKDAYS[diaSemanaOrdem - 1];

      if (startedAt) {
        const diffMs = completedAt - startedAt;
        duracaoMinutos = Math.max(0, Math.floor(diffMs / 1000 / 60));
      }
    }

    processedRows.push({
      study: row.Study || 'Sem Título',
      reward: rewardStr,
      bonus: bonusStr,
      startedAt,
      completedAt,
      completionCode: row['Completion Code'] || '',
      statusRaw: row.Status || '',
      statusResumo,
      moeda,
      rewardNumeric,
      bonusNumeric,
      valorTotalOriginal,
      valorTotalBRL,
      dataConclusaoDiaStr,
      mesAnoStr,
      anoMesOrdem,
      diaSemanaStr,
      diaSemanaOrdem,
      duracaoMinutos,
      horaInicio,
      faixaHoraria
    });
  });

  // Ordenar estudos por data de início descendente
  processedRows.sort((a, b) => {
    if (!a.startedAt) return 1;
    if (!b.startedAt) return -1;
    return b.startedAt - a.startedAt;
  });

  return processedRows;
}

// Função para calcular todas as métricas agregadas do dashboard
export function calculateDashboardMetrics(submissions) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let totalEstudos = 0;
  let totalAprovados = 0;
  let totalRetornados = 0;
  let totalEmReview = 0;
  let totalRejeitados = 0;

  let ganhosAprovadosBRL = 0;
  let ganhosGBP_BRL = 0;
  let ganhosUSD_BRL = 0;
  let valorTotalGeralBRL = 0;
  let valorRepresadoBRL = 0; // Em review
  let ganhosHojeBRL = 0;
  let ganhosSemanaBRL = 0;
  let ganhosHojeOriginalUSD = 0;
  let ganhosHojeOriginalGBP = 0;

  const nowTime = new Date();
  const startOfWeek = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate());
  const currentDay = startOfWeek.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  startOfWeek.setDate(startOfWeek.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const ganhosPorDia = {}; // { 'YYYY-MM-DD': { brl: 0, dateObj: Date } }
  const porDiaSemana = WEEKDAYS.reduce((acc, cur) => ({ ...acc, [cur]: { total: 0, approved: 0 } }), {});
  const porDiaSemanaFaturamento = WEEKDAYS.reduce((acc, cur) => ({ ...acc, [cur]: 0 }), {});
  const porDiaSemanaPeriodo = WEEKDAYS.reduce((acc, cur) => ({
    ...acc,
    [cur]: { Madrugada: 0, Manhã: 0, Tarde: 0, Noite: 0 }
  }), {});
  const porFaixaHoraria = Array.from({ length: 24 }).reduce((acc, _, i) => {
    const key = `${String(i).padStart(2, '0')}:00`;
    return { ...acc, [key]: { total: 0, approved: 0 } };
  }, {});
  const porStatus = { 'Aprovado': 0, 'Em review': 0, 'Retornado': 0, 'Rejeitado': 0, 'Outro': 0 };
  const porMesAno = {}; // { '202605': { mesAno: 'mai/26', valor: 0 } }

  // Variáveis de Eficiência
  let totalMinutosAprovados = 0;
  const porMesAnoEficiencia = {}; // { '202605': { label: 'mai/26', valor: 0, minutos: 0 } }
  const porFaixaHorariaFaturamento = Array.from({ length: 24 }).reduce((acc, _, i) => {
    const key = `${String(i).padStart(2, '0')}:00`;
    return { ...acc, [key]: { valor: 0, total: 0, minutos: 0 } };
  }, {});

  submissions.forEach((sub) => {
    totalEstudos++;
    
    // Contagem por Status
    porStatus[sub.statusResumo] = (porStatus[sub.statusResumo] || 0) + 1;
    
    if (sub.statusResumo === 'Aprovado') {
      totalAprovados++;
      ganhosAprovadosBRL += sub.valorTotalBRL;
      if (sub.moeda === 'USD') {
        ganhosUSD_BRL += sub.valorTotalBRL;
      } else {
        ganhosGBP_BRL += sub.valorTotalBRL;
      }
      totalMinutosAprovados += (sub.duracaoMinutos || 0);
    } else if (sub.statusResumo === 'Retornado') {
      totalRetornados++;
    } else if (sub.statusResumo === 'Em review') {
      totalEmReview++;
      valorRepresadoBRL += sub.valorTotalBRL;
    } else if (sub.statusResumo === 'Rejeitado') {
      totalRejeitados++;
    }

    valorTotalGeralBRL += sub.valorTotalBRL;

    // Ganhos de hoje
    if (sub.statusResumo === 'Aprovado' && sub.dataConclusaoDiaStr === todayStr) {
      ganhosHojeBRL += sub.valorTotalBRL;
      if (sub.moeda === 'USD') {
        ganhosHojeOriginalUSD += sub.valorTotalOriginal;
      } else {
        ganhosHojeOriginalGBP += sub.valorTotalOriginal;
      }
    }

    // Ganhos da semana atual
    if (sub.statusResumo === 'Aprovado' && sub.completedAt && sub.completedAt >= startOfWeek) {
      ganhosSemanaBRL += sub.valorTotalBRL;
    }

    // Agregações por dia de conclusão
    if (sub.statusResumo === 'Aprovado' && sub.dataConclusaoDiaStr) {
      if (!ganhosPorDia[sub.dataConclusaoDiaStr]) {
        ganhosPorDia[sub.dataConclusaoDiaStr] = { brl: 0, dateObj: sub.completedAt };
      }
      ganhosPorDia[sub.dataConclusaoDiaStr].brl += sub.valorTotalBRL;
    }

    // Agregações por dia da semana
    if (sub.diaSemanaStr) {
      porDiaSemana[sub.diaSemanaStr].total++;
      if (sub.statusResumo === 'Aprovado') {
        porDiaSemana[sub.diaSemanaStr].approved++;
        porDiaSemanaFaturamento[sub.diaSemanaStr] += sub.valorTotalBRL;
      }
      
      if (sub.horaInicio !== null) {
        const hora = sub.horaInicio;
        let periodo = 'Madrugada';
        if (hora >= 6 && hora < 12) periodo = 'Manhã';
        else if (hora >= 12 && hora < 18) periodo = 'Tarde';
        else if (hora >= 18 && hora < 24) periodo = 'Noite';
        
        if (porDiaSemanaPeriodo[sub.diaSemanaStr]) {
          porDiaSemanaPeriodo[sub.diaSemanaStr][periodo]++;
        }
      }
    }

    // Agregações por faixa horária
    if (sub.faixaHoraria) {
      if (porFaixaHoraria[sub.faixaHoraria]) {
        porFaixaHoraria[sub.faixaHoraria].total++;
        if (sub.statusResumo === 'Aprovado') {
          porFaixaHoraria[sub.faixaHoraria].approved++;
        }
      }
      // Faturamento e eficiência por faixa horária
      if (sub.statusResumo === 'Aprovado' && porFaixaHorariaFaturamento[sub.faixaHoraria]) {
        porFaixaHorariaFaturamento[sub.faixaHoraria].valor += sub.valorTotalBRL;
        porFaixaHorariaFaturamento[sub.faixaHoraria].total++;
        porFaixaHorariaFaturamento[sub.faixaHoraria].minutos += (sub.duracaoMinutos || 0);
      }
    }

    // Agregações por Mês/Ano
    if (sub.statusResumo === 'Aprovado' && sub.mesAnoStr && sub.anoMesOrdem) {
      const ordKey = String(sub.anoMesOrdem);
      if (!porMesAno[ordKey]) {
        porMesAno[ordKey] = { label: sub.mesAnoStr, valor: 0, key: sub.anoMesOrdem };
      }
      porMesAno[ordKey].valor += sub.valorTotalBRL;

      // Agregação para eficiência mensal
      if (!porMesAnoEficiencia[ordKey]) {
        porMesAnoEficiencia[ordKey] = { label: sub.mesAnoStr, valor: 0, minutos: 0 };
      }
      porMesAnoEficiencia[ordKey].valor += sub.valorTotalBRL;
      porMesAnoEficiencia[ordKey].minutos += (sub.duracaoMinutos || 0);
    }
  });

  // Média por estudo aprovado
  const mediaPorEstudoBRL = totalAprovados > 0 ? (ganhosAprovadosBRL / totalAprovados) : 0;

  // Taxa de aprovação
  const taxaAprovacao = (totalAprovados + totalRejeitados) > 0 ? (totalAprovados / (totalAprovados + totalRejeitados)) : 0;

  // Melhores recordes (Dia e Mês)
  let melhorDiaBRL = 0;
  let melhorDiaLabel = '-';
  Object.keys(ganhosPorDia).forEach((dayStr) => {
    const val = ganhosPorDia[dayStr].brl;
    if (val > melhorDiaBRL) {
      melhorDiaBRL = val;
      const d = ganhosPorDia[dayStr].dateObj;
      const day = String(d.getDate()).padStart(2, '0');
      const m = String(d.getMonth() + 1).padStart(2, '0');
      melhorDiaLabel = `${day}/${m} • R$ ${val.toFixed(2)}`;
    }
  });

  let melhorMesBRL = 0;
  let melhorMesLabel = '-';
  Object.keys(porMesAno).forEach((ordKey) => {
    const data = porMesAno[ordKey];
    if (data.valor > melhorMesBRL) {
      melhorMesBRL = data.valor;
      melhorMesLabel = `${data.label} • R$ ${data.valor.toFixed(2)}`;
    }
  });

  // Média Diária (dias ativos com ganhos aprovados)
  const totalDiasAtivos = Object.keys(ganhosPorDia).length;
  const mediaDiariaBRL = totalDiasAtivos > 0 ? (ganhosAprovadosBRL / totalDiasAtivos) : 0;

  // Média Mensal (meses ativos com ganhos aprovados)
  const totalMesesAtivos = Object.keys(porMesAno).length;
  const mediaMensalBRL = totalMesesAtivos > 0 ? (ganhosAprovadosBRL / totalMesesAtivos) : 0;

  // Formatar dados para gráficos
  // 1. Histórico de ganhos acumulados ao longo do tempo (ordenado cronologicamente)
  const sortedDays = Object.keys(ganhosPorDia).sort();
  let acumulado = 0;
  const graficoAcumuladoData = sortedDays.map((dayStr) => {
    acumulado += ganhosPorDia[dayStr].brl;
    const dObj = ganhosPorDia[dayStr].dateObj;
    return {
      dateStr: dayStr,
      formattedDate: `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}`,
      ganhoDia: ganhosPorDia[dayStr].brl,
      ganhoAcumulado: acumulado
    };
  });

  // 2. Gráfico por dia da semana
  const graficoDiaSemanaData = WEEKDAYS.map((day) => ({
    name: day,
    total: porDiaSemana[day].total,
    approved: porDiaSemana[day].approved
  }));

  // 2.2 Gráfico de faturamento por dia da semana
  const graficoFaturamentoDiaSemanaData = WEEKDAYS.map((day) => ({
    name: day,
    valor: porDiaSemanaFaturamento[day]
  }));

  // 2.5 Gráfico por dia da semana e período
  const graficoDiaSemanaPeriodoData = WEEKDAYS.map((day) => ({
    name: day,
    Madrugada: porDiaSemanaPeriodo[day].Madrugada,
    Manhã: porDiaSemanaPeriodo[day].Manhã,
    Tarde: porDiaSemanaPeriodo[day].Tarde,
    Noite: porDiaSemanaPeriodo[day].Noite
  }));

  // 3. Gráfico por faixa horária
  const graficoFaixaHorariaData = Object.keys(porFaixaHoraria).sort().map((faixa) => ({
    name: faixa,
    total: porFaixaHoraria[faixa].total,
    approved: porFaixaHoraria[faixa].approved
  }));

  // 4. Gráfico de status
  const graficoStatusData = Object.keys(porStatus).map((status) => ({
    name: status,
    value: porStatus[status]
  }));

  // 5. Gráfico histórico mensal
  const graficoMensalData = Object.keys(porMesAno)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((ordKey) => ({
      name: porMesAno[ordKey].label,
      valor: porMesAno[ordKey].valor
    }));

  const graficoMoedaData = [
    { name: 'Libra (GBP)', value: ganhosGBP_BRL },
    { name: 'Dólar (USD)', value: ganhosUSD_BRL }
  ];

  // === STREAK DE DIAS CONSECUTIVOS ===
  let streak = 0;
  if (sortedDays.length > 0) {
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Verifica se hoje tem ganhos, senão começa de ontem
    let checkDate = new Date(todayDate);
    if (!ganhosPorDia[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (ganhosPorDia[checkStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // === RANGE DE DATAS DO DATASET ===
  let dataRangeLabel = 'N/A';
  if (sortedDays.length > 0) {
    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];
    const fd = new Date(firstDay + 'T00:00:00');
    const ld = new Date(lastDay + 'T00:00:00');
    const fmtDate = (d) => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${months[d.getMonth()]}/${d.getFullYear()}`;
    };
    dataRangeLabel = `${fmtDate(fd)} — ${fmtDate(ld)}`;
  }

  // === GAMIFICAÇÃO: SISTEMA DE NÍVEIS E XP ===
  // 50 XP por estudo aprovado + 10 XP por cada R$ 1 ganho
  const totalXP = (totalAprovados * 50) + Math.floor(ganhosAprovadosBRL * 10);
  const currentLevel = Math.floor(Math.sqrt(totalXP / 50)) + 1;
  const nextLevelXP = Math.pow(currentLevel, 2) * 50;
  const currentLevelBaseXP = Math.pow(currentLevel - 1, 2) * 50;
  
  const xpIntoCurrentLevel = totalXP - currentLevelBaseXP;
  const xpNeededForNext = nextLevelXP - currentLevelBaseXP;
  const levelProgress = xpNeededForNext > 0 ? (xpIntoCurrentLevel / xpNeededForNext) * 100 : 100;

  let levelTitle = 'Iniciante';
  if (currentLevel >= 5) levelTitle = 'Explorador';
  if (currentLevel >= 15) levelTitle = 'Pesquisador';
  if (currentLevel >= 30) levelTitle = 'Especialista';
  if (currentLevel >= 50) levelTitle = 'Elite';
  if (currentLevel >= 80) levelTitle = 'Lenda do Prolific';

  const gamification = {
    totalXP,
    currentLevel,
    nextLevelXP,
    levelProgress,
    levelTitle
  };

  // === EFICIÊNCIA METRICS ===
  const totalHorasAprovadas = totalMinutosAprovados / 60;
  const reaisPorHora = totalHorasAprovadas > 0 ? (ganhosAprovadosBRL / totalHorasAprovadas) : 0;
  const tempoMedioEstudoMinutos = totalAprovados > 0 ? (totalMinutosAprovados / totalAprovados) : 0;
  const estudosPorDia = totalDiasAtivos > 0 ? (totalAprovados / totalDiasAtivos) : 0;

  // Projeção Mensal (Inteligente)
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDayOfMonth = today.getDate();
  const remainingDays = Math.max(0, lastDayOfMonth - currentDayOfMonth);
  
  const currentMonthKey = `${currentYear}${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthEarnings = porMesAno[currentMonthKey]?.valor || 0;
  
  // Calcular média diária apenas do mês atual (ganhos do mês / dia atual)
  const mediaDiariaMesAtual = currentDayOfMonth > 0 ? (currentMonthEarnings / currentDayOfMonth) : 0;
  const projecaoMensalBRL = currentMonthEarnings + (mediaDiariaMesAtual * remainingDays);

  // Gráfico Eficiência Mensal (Evolução do R$/Hora)
  const graficoEficienciaMensal = Object.keys(porMesAnoEficiencia)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((ordKey) => {
      const item = porMesAnoEficiencia[ordKey];
      const horas = item.minutos / 60;
      const rpHora = horas > 0 ? (item.valor / horas) : 0;
      return {
        name: item.label,
        rpHora: parseFloat(rpHora.toFixed(2)),
        valor: parseFloat(item.valor.toFixed(2))
      };
    });

  // Gráfico Faixas Horárias Mais Lucrativas (R$/Hora e Valor Médio por faixa)
  const graficoFaixaHorariaEficiencia = Object.keys(porFaixaHorariaFaturamento).sort().map((faixa) => {
    const item = porFaixaHorariaFaturamento[faixa];
    const mediaValor = item.total > 0 ? (item.valor / item.total) : 0;
    const horas = item.minutos / 60;
    const rpHora = horas > 0 ? (item.valor / horas) : 0;
    return {
      name: faixa,
      mediaValor: parseFloat(mediaValor.toFixed(2)),
      rpHora: parseFloat(rpHora.toFixed(2)),
      valor: parseFloat(item.valor.toFixed(2))
    };
  });

  // Top 5 Estudos Mais Eficientes (R$/Hora)
  const topEstudosEficientes = submissions
    .filter(s => s.statusResumo === 'Aprovado' && s.duracaoMinutos > 0 && s.valorTotalBRL > 0)
    .map(s => ({
      ...s,
      rpHora: s.valorTotalBRL / (s.duracaoMinutos / 60)
    }))
    .sort((a, b) => b.rpHora - a.rpHora)
    .slice(0, 5)
    .map(s => ({
      study: s.study,
      valor: parseFloat(s.valorTotalBRL.toFixed(2)),
      duracao: s.duracaoMinutos,
      rpHora: parseFloat(s.rpHora.toFixed(2)),
      data: s.dataConclusaoDiaStr
    }));

  return {
    kpis: {
      totalEstudos,
      totalAprovados,
      totalRetornados,
      totalEmReview,
      totalRejeitados,
      ganhosAprovadosBRL,
      valorTotalGeralBRL,
      valorRepresadoBRL,
      ganhosHojeBRL,
      ganhosSemanaBRL,
      ganhosHojeOriginalUSD,
      ganhosHojeOriginalGBP,
      mediaPorEstudoBRL,
      taxaAprovacao,
      melhorDiaBRL,
      melhorDiaLabel,
      melhorMesBRL,
      melhorMesLabel,
      mediaDiariaBRL,
      mediaMensalBRL,
      streak,
      dataRangeLabel,
      gamification,
      reaisPorHora,
      tempoMedioEstudoMinutos,
      estudosPorDia,
      currentMonthEarnings,
      projecaoMensalBRL
    },
    charts: {
      acumulado: graficoAcumuladoData,
      diaSemana: graficoDiaSemanaData,
      faturamentoDiaSemana: graficoFaturamentoDiaSemanaData,
      diaSemanaPeriodo: graficoDiaSemanaPeriodoData,
      faixaHoraria: graficoFaixaHorariaData,
      status: graficoStatusData,
      moeda: graficoMoedaData,
      mensal: graficoMensalData,
      eficienciaMensal: graficoEficienciaMensal,
      faixaHorariaEficiencia: graficoFaixaHorariaEficiencia,
      topEstudosEficientes: topEstudosEficientes
    }
  };
}
