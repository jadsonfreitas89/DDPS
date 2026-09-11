/**
 * ============================================================
 * DDPS WEB APP
 * NOVA ARQUITETURA — GOOGLE SHEETS
 * ============================================================
 *
 * ABAS:
 *
 * CONFIG
 * FUNCIONARIOS
 * DDS
 * PARTICIPANTES
 * ASSINATURAS
 *
 * ============================================================
 */


/* ============================================================
 * CONFIGURAÇÃO GERAL
 * ============================================================ */

var DDPS_ABAS = {
  CONFIG: 'CONFIG',
  FUNCIONARIOS: 'FUNCIONARIOS',
  DDS: 'DDS',
  PARTICIPANTES: 'PARTICIPANTES',
  ASSINATURAS: 'ASSINATURAS'
};


/* ============================================================
 * INSTALAÇÃO
 * ============================================================ */

function instalarDDPS() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('==============================================');
  Logger.log('INSTALAÇÃO DO NOVO DDPS');
  Logger.log('==============================================');

  criarAba(
    ss,
    DDPS_ABAS.CONFIG,
    [
      'CONFIGURACAO',
      'VALOR'
    ]
  );

  criarAba(
    ss,
    DDPS_ABAS.FUNCIONARIOS,
    [
      'ID_FUNCIONARIO',
      'NOME',
      'FUNCAO',
      'ATIVO'
    ]
  );

  criarAba(
    ss,
    DDPS_ABAS.DDS,
    [
      'ID_DDS',
      'SEMANA_ID',
      'DATA',
      'HORARIO',
      'DIA_SEMANA',
      'TEMA',
      'CONTEUDO',
      'LOCAL',
      'RESPONSAVEL',
      'OBSERVACOES',
      'STATUS',
      'DATA_CRIACAO'
    ]
  );

  criarAba(
    ss,
    DDPS_ABAS.PARTICIPANTES,
    [
      'ID_DDS',
      'ID_FUNCIONARIO',
      'NOME',
      'EMOCIOGRAMA',
      'ASSINATURA',
      'DATA_HORA'
    ]
  );

  criarAba(
    ss,
    DDPS_ABAS.ASSINATURAS,
    [
      'ID_ASSINATURA',
      'ID_DDS',
      'ID_FUNCIONARIO',
      'ARQUIVO',
      'DATA_HORA'
    ]
  );

  configurarInicialmente();

  SpreadsheetApp.flush();

  Logger.log('==============================================');
  Logger.log('INSTALAÇÃO CONCLUÍDA');
  Logger.log('==============================================');

  SpreadsheetApp.getUi().alert(
    'DDPS',
    'Estrutura inicial criada com sucesso.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* ============================================================
 * CRIAR ABA
 * ============================================================ */

function criarAba(ss, nome, cabecalhos) {

  var sheet = ss.getSheetByName(nome);

  if (!sheet) {

    sheet = ss.insertSheet(nome);

    Logger.log(
      'ABA CRIADA -> ' + nome
    );

  } else {

    Logger.log(
      'ABA EXISTENTE -> ' + nome
    );
  }

  sheet
    .getRange(
      1,
      1,
      1,
      cabecalhos.length
    )
    .setValues([cabecalhos]);

  var cabecalho = sheet.getRange(
    1,
    1,
    1,
    cabecalhos.length
  );

  cabecalho.setFontWeight('bold');

  cabecalho.setHorizontalAlignment(
    'center'
  );

  sheet.setFrozenRows(1);

  sheet.autoResizeColumns(
    1,
    cabecalhos.length
  );
}


/* ============================================================
 * CONFIGURAÇÃO INICIAL
 * ============================================================ */

function configurarInicialmente() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheet =
    ss.getSheetByName(
      DDPS_ABAS.CONFIG
    );

  var configuracoes = [

    [
      'CONTRATADA',
      ''
    ],

    [
      'SUB_CONTRATADA',
      ''
    ],

    [
      'LOCAL',
      ''
    ],

    [
      'RESPONSAVEL_SHE',
      ''
    ],

    [
      'SEMANA_ATUAL',
      ''
    ],

    [
      'SISTEMA',
      'DDPS WEB APP'
    ],

    [
      'VERSAO',
      '1.0'
    ],

    [
      'ULTIMA_ATUALIZACAO',
      new Date()
    ]

  ];

  if (sheet.getLastRow() <= 1) {

    sheet
      .getRange(
        2,
        1,
        configuracoes.length,
        2
      )
      .setValues(
        configuracoes
      );

    Logger.log(
      'CONFIGURAÇÕES INICIAIS CRIADAS.'
    );

  } else {

    Logger.log(
      'CONFIG JÁ POSSUI DADOS. NADA ALTERADO.'
    );
  }
}


/* ============================================================
 * TESTE DO BANCO
 * ============================================================ */

function testarBancoDDPS() {

  var ss =
    SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('==============================================');
  Logger.log('TESTE DO BANCO DDPS');
  Logger.log('==============================================');

  var nomes = [
    DDPS_ABAS.CONFIG,
    DDPS_ABAS.FUNCIONARIOS,
    DDPS_ABAS.DDS,
    DDPS_ABAS.PARTICIPANTES,
    DDPS_ABAS.ASSINATURAS
  ];

  for (var i = 0; i < nomes.length; i++) {

    var sheet =
      ss.getSheetByName(nomes[i]);

    if (!sheet) {

      Logger.log(
        'ERRO -> ABA NÃO ENCONTRADA: ' +
        nomes[i]
      );

      continue;
    }

    Logger.log(
      'OK -> ' +
      nomes[i] +
      ' | linhas=' +
      sheet.getLastRow() +
      ' | colunas=' +
      sheet.getLastColumn()
    );
  }

  Logger.log('==============================================');
  Logger.log('TESTE FINALIZADO');
  Logger.log('==============================================');
}


/* ============================================================
 * WEB APP — GET
 * ============================================================ */

function doGet(e) {
  if (e && e.parameter) {
    var acao = e.parameter.acao || e.parameter.action;
    if (acao === 'listarDDS') {
      return respostaJSON(listarDDS());
    }
    if (acao === 'listarFuncionarios' || acao === 'funcionarios') {
      return respostaJSON(listarFuncionarios());
    }
    if (acao === 'participantes' && e.parameter.idDDS) {
      return respostaJSON(obterParticipantesDDS(e.parameter.idDDS));
    }
  }

  return respostaJSON({
    sucesso: true,
    sistema: 'DDPS WEB APP',
    versao: '1.0',
    mensagem: 'API DDPS funcionando.'
  });
}


/* ============================================================
 * WEB APP — POST
 * ============================================================ */

function doPost(e) {

  try {

    var dados = {};

    if (
      e &&
      e.postData &&
      e.postData.contents
    ) {

      dados =
        JSON.parse(
          e.postData.contents
        );
    }

    var acao = dados.acao || dados.action;

    switch (acao) {
      case 'listarFuncionarios':
      case 'funcionarios':
        return respostaJSON(listarFuncionarios());

      case 'cadastrarFuncionario':
        return respostaJSON(cadastrarFuncionario(dados.nome, dados.funcao || dados.cargo));

      case 'obterFuncionario':
        return respostaJSON(obterFuncionario(dados.idFuncionario || dados.id));

      case 'alterarFuncionario':
      case 'editarFuncionario':
        return respostaJSON(alterarFuncionario(dados.idFuncionario || dados.id, dados.nome, dados.funcao || dados.cargo, dados.ativo));

      case 'alterarStatusFuncionario':
        return respostaJSON(alterarStatusFuncionario(dados.idFuncionario || dados.id, dados.ativo));

      case 'excluirFuncionario':
        return respostaJSON(excluirFuncionario(dados.idFuncionario || dados.id));

      case 'criarDDS':
      case 'criarDds':
        return respostaJSON(criarDDS(dados));

      case 'salvarParticipantes':
        return respostaJSON(registrarParticipantesEmLote(dados.idDDS, dados.participantes));

      case 'salvarParticipante':
        var resPart = registrarParticipante(dados.idDDS, dados.idFuncionario || dados.id, dados.emociograma);
        if (dados.assinatura) {
          try {
            registrarAssinatura(dados.idDDS, dados.idFuncionario || dados.id, dados.assinatura);
          } catch(errAssinatura) {
            Logger.log('Erro ao salvar assinatura individual: ' + errAssinatura.message);
          }
        }
        return respostaJSON(resPart);

      case 'finalizarDDS':
        return respostaJSON(finalizarDDS(dados.idDDS));

      default:
        return respostaJSON({
          sucesso: false,
          erro: 'Ação POST não reconhecida: ' + (acao || 'nenhuma ação informada'),
          dadosRecebidos: dados
        });
    }

  } catch (erro) {

    return respostaJSON({

      sucesso: false,

      erro:
        erro.message

    });
  }
}


/* ============================================================
 * RESPOSTA JSON
 * ============================================================ */

function respostaJSON(objeto) {

  return ContentService
    .createTextOutput(
      JSON.stringify(objeto)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/* ============================================================
 * CAIXA ALTA
 * ============================================================ */

function caixaAltaDDPS(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim().toUpperCase();
}


/* ============================================================
 * FUNCIONÁRIOS
 * ============================================================ */

function garantirSchemaFuncionarios(sheet) {
  if (!sheet) return;
  var colCount = sheet.getLastColumn();
  if (colCount < 2) return; 
  
  var headers = sheet.getRange(1, 1, 1, Math.max(1, colCount)).getValues()[0];
  var headersUpper = headers.map(function(h) { return String(h).trim().toUpperCase(); });
  
  if (headersUpper.indexOf('FUNCAO') === -1 && headersUpper.indexOf('FUNÇÃO') === -1) {
    var idxAtivo = headersUpper.indexOf('ATIVO');
    if (idxAtivo !== -1) {
      var colIndex = idxAtivo + 1;
      sheet.insertColumnBefore(colIndex);
      sheet.getRange(1, colIndex).setValue('FUNCAO');
      sheet.getRange(1, colIndex).setFontWeight('bold');
      sheet.getRange(1, colIndex).setHorizontalAlignment('center');
      SpreadsheetApp.flush();
    } else {
      sheet.getRange(1, colCount + 1).setValue('FUNCAO');
      sheet.getRange(1, colCount + 1).setFontWeight('bold');
      sheet.getRange(1, colCount + 1).setHorizontalAlignment('center');
      SpreadsheetApp.flush();
    }
  }
}


function cadastrarFuncionario(nome, funcao) {

  nome = caixaAltaDDPS(nome);
  funcao = caixaAltaDDPS(funcao);

  if (!nome) {

    throw new Error(
      'Informe o nome do colaborador.'
    );
  }

  if (!funcao) {

    throw new Error(
      'Informe a função do colaborador.'
    );
  }

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.FUNCIONARIOS
      );

  if (!sheet) {

    throw new Error(
      'Aba FUNCIONARIOS não encontrada.'
    );
  }

  garantirSchemaFuncionarios(sheet);

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha >= 2) {

    var dados =
      sheet
        .getRange(
          2,
          1,
          ultimaLinha - 1,
          2
        )
        .getValues();

    var nomeNovo =
      normalizarNomeDDPS(nome);

    for (
      var i = 0;
      i < dados.length;
      i++
    ) {

      var nomeExistente =
        normalizarNomeDDPS(
          dados[i][1]
        );

      if (
        nomeExistente &&
        nomeExistente === nomeNovo
      ) {

        throw new Error(
          'Funcionário já cadastrado: ' +
          dados[i][1] +
          ' (' +
          dados[i][0] +
          ')'
        );
      }
    }
  }

  var idFuncionario =
    gerarProximoIdFuncionario();

  sheet.appendRow([
    idFuncionario,
    nome,
    funcao,
    'SIM'
  ]);

  SpreadsheetApp.flush();

  Logger.log(
    'FUNCIONÁRIO CADASTRADO -> ' +
    idFuncionario +
    ' | ' +
    nome +
    ' | ' +
    funcao
  );

  return {

    sucesso: true,

    idFuncionario:
      idFuncionario,

    nome:
      nome,

    funcao:
      funcao,

    ativo:
      true
  };
}


/* ============================================================
 * GERAR ID FUNCIONÁRIO
 * ============================================================ */

function gerarProximoIdFuncionario() {

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.FUNCIONARIOS
      );

  if (!sheet) {

    throw new Error(
      'Aba FUNCIONARIOS não encontrada.'
    );
  }

  var ultimaLinha =
    sheet.getLastRow();

  var maiorNumero = 0;

  if (ultimaLinha >= 2) {

    var ids =
      sheet
        .getRange(
          2,
          1,
          ultimaLinha - 1,
          1
        )
        .getValues();

    for (
      var i = 0;
      i < ids.length;
      i++
    ) {

      var id =
        String(
          ids[i][0] || ''
        ).trim();

      var match =
        id.match(
          /^FUNC-(\d+)$/i
        );

      if (match) {

        var numero =
          Number(match[1]);

        if (
          !isNaN(numero) &&
          numero > maiorNumero
        ) {

          maiorNumero =
            numero;
        }
      }
    }
  }

  return 'FUNC-' +
    String(
      maiorNumero + 1
    ).padStart(3, '0');
}


/* ============================================================
 * LISTAR FUNCIONÁRIOS
 * ============================================================ */

function listarFuncionarios() {

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.FUNCIONARIOS
      );

  if (!sheet) {

    throw new Error(
      'Aba FUNCIONARIOS não encontrada.'
    );
  }

  garantirSchemaFuncionarios(sheet);

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {

    return {

      sucesso: true,

      funcionarios: []

    };
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        4
      )
      .getValues();

  var funcionarios = [];

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    if (!dados[i][0]) {
      continue;
    }

    funcionarios.push({

      idFuncionario:
        String(
          dados[i][0]
        ).trim(),

      nome:
        String(
          dados[i][1] || ''
        ).trim(),

      funcao:
        String(
          dados[i][2] || ''
        ).trim(),

      ativo:
        String(
          dados[i][3] || ''
        )
        .trim()
        .toUpperCase() === 'SIM'

    });
  }

  return {

    sucesso: true,

    funcionarios:
      funcionarios
  };
}


/* ============================================================
 * OBTER FUNCIONÁRIO
 * ============================================================ */

function obterFuncionario(idFuncionario) {

  idFuncionario =
    String(
      idFuncionario || ''
    ).trim();

  if (!idFuncionario) {

    throw new Error(
      'Informe o ID do funcionário.'
    );
  }

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.FUNCIONARIOS
      );

  if (!sheet) {

    throw new Error(
      'Aba FUNCIONARIOS não encontrada.'
    );
  }

  garantirSchemaFuncionarios(sheet);

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        4
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    if (
      String(dados[i][0]).trim() ===
      idFuncionario
    ) {

      return {

        idFuncionario:
          String(
            dados[i][0]
          ).trim(),

        nome:
          String(
            dados[i][1] || ''
          ).trim(),

        funcao:
          String(
            dados[i][2] || ''
          ).trim(),

        ativo:
          String(
            dados[i][3] || ''
          )
          .trim()
          .toUpperCase() === 'SIM'
      };
    }
  }

  return null;
}


/* ============================================================
 * ALTERAR STATUS FUNCIONÁRIO
 * ============================================================ */

function alterarStatusFuncionario(
  idFuncionario,
  ativo
) {

  idFuncionario =
    String(
      idFuncionario || ''
    ).trim();

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.FUNCIONARIOS
      );

  if (!sheet) {

    throw new Error(
      'Aba FUNCIONARIOS não encontrada.'
    );
  }

  garantirSchemaFuncionarios(sheet);

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {

    throw new Error(
      'Nenhum funcionário cadastrado.'
    );
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        4
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    if (
      String(dados[i][0]).trim() ===
      idFuncionario
    ) {

      var linha =
        i + 2;

      sheet
        .getRange(
          linha,
          4
        )
        .setValue(
          ativo ? 'SIM' : 'NAO'
        );

      SpreadsheetApp.flush();

      Logger.log(
        'STATUS ALTERADO -> ' +
        idFuncionario +
        ' | ativo=' +
        ativo
      );

      return {

        sucesso: true,

        idFuncionario:
          idFuncionario,

        ativo:
          ativo
      };
    }
  }

  throw new Error(
    'Funcionário não encontrado: ' +
    idFuncionario
  );
}


/* ============================================================
 * EDITAR FUNCIONÁRIO
 * ============================================================ */

function alterarFuncionario(idFuncionario, nome, funcao, ativo) {
  idFuncionario = String(idFuncionario || '').trim();
  nome = caixaAltaDDPS(nome);
  funcao = caixaAltaDDPS(funcao);
  
  if (!idFuncionario) throw new Error('ID do colaborador não informado.');
  if (!nome) throw new Error('Informe o nome do colaborador.');
  if (!funcao) throw new Error('Informe a função do colaborador.');
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DDPS_ABAS.FUNCIONARIOS);
  if (!sheet) throw new Error('Aba de colaboradores não encontrada.');
  
  garantirSchemaFuncionarios(sheet);
  
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) throw new Error('Nenhum colaborador cadastrado.');
  
  var dados = sheet.getRange(2, 1, ultimaLinha - 1, 4).getValues();
  var linhaAlvo = -1;
  
  for (var i = 0; i < dados.length; i++) {
    var idAtual = String(dados[i][0]).trim();
    var nomeAtual = String(dados[i][1]).trim();
    
    if (nomeAtual.toLowerCase() === nome.toLowerCase() && idAtual !== idFuncionario) {
      throw new Error('Já existe outro colaborador cadastrado com este nome.');
    }
    
    if (idAtual === idFuncionario) {
      linhaAlvo = i + 2;
    }
  }
  
  if (linhaAlvo === -1) {
    throw new Error('Colaborador não encontrado: ' + idFuncionario);
  }
  
  sheet.getRange(linhaAlvo, 2).setValue(nome);
  sheet.getRange(linhaAlvo, 3).setValue(funcao);
  if (ativo !== undefined && ativo !== null) {
    sheet.getRange(linhaAlvo, 4).setValue(ativo === true || String(ativo).toUpperCase() === 'SIM' ? 'SIM' : 'NAO');
  }
  
  SpreadsheetApp.flush();
  
  return {
    sucesso: true,
    idFuncionario: idFuncionario,
    nome: nome,
    funcao: funcao,
    ativo: ativo === true || String(ativo).toUpperCase() === 'SIM'
  };
}

function editarFuncionario(idFuncionario, nome, funcao) {
  return alterarFuncionario(idFuncionario, nome, funcao || '', true);
}


/* ============================================================
 * EXCLUIR FUNCIONÁRIO
 * ============================================================ */

function excluirFuncionario(idFuncionario) {
  try {
    if (!idFuncionario) {
      throw new Error('ID do colaborador não informado.');
    }

    idFuncionario = String(idFuncionario).trim();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(DDPS_ABAS.FUNCIONARIOS);

    if (!sheet) {
      throw new Error('Aba de colaboradores não encontrada.');
    }

    var dados = sheet.getDataRange().getValues();

    for (var i = dados.length - 1; i >= 1; i--) {

      if (String(dados[i][0]).trim() === idFuncionario) {

        sheet.deleteRow(i + 1);

        SpreadsheetApp.flush();

        return {
          sucesso: true,
          mensagem: 'Colaborador excluído com sucesso.',
          idFuncionario: idFuncionario
        };
      }
    }

    return {
      sucesso: false,
      erro: 'Colaborador não encontrado.'
    };

  } catch (erro) {

    return {
      sucesso: false,
      erro: erro.message
    };
  }
}


/* ============================================================
 * NORMALIZAR NOME
 * ============================================================ */

function normalizarNomeDDPS(nome) {

  return String(nome || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    );
}


/* ============================================================
 * TESTE FUNCIONÁRIOS
 * ============================================================ */

function TESTAR_FUNCIONARIOS() {

  Logger.log('==============================================');
  Logger.log('TESTE DE FUNCIONÁRIOS');
  Logger.log('==============================================');

  var nomesTeste = [

    'FUNCIONARIO TESTE 01',
    'FUNCIONARIO TESTE 02',
    'FUNCIONARIO TESTE 03'

  ];

  for (
    var i = 0;
    i < nomesTeste.length;
    i++
  ) {

    try {

      var resultado =
        cadastrarFuncionario(
          nomesTeste[i]
        );

      Logger.log(
        'CADASTRADO -> ' +
        resultado.idFuncionario +
        ' | ' +
        resultado.nome
      );

    } catch (erro) {

      Logger.log(
        'AVISO -> ' +
        erro.message
      );
    }
  }

  var lista =
    listarFuncionarios();

  Logger.log(
    'TOTAL DE FUNCIONÁRIOS = ' +
    lista.funcionarios.length
  );

  for (
    var j = 0;
    j < lista.funcionarios.length;
    j++
  ) {

    var funcionario =
      lista.funcionarios[j];

    Logger.log(
      funcionario.idFuncionario +
      ' | ' +
      funcionario.nome +
      ' | ativo=' +
      funcionario.ativo
    );
  }

  Logger.log('==============================================');
  Logger.log('TESTE FINALIZADO');
  Logger.log('==============================================');
}


/* ============================================================
 * DDS
 * ============================================================ */

function criarDDS(dados) {

  dados = dados || {};

  var tema =
    String(
      dados.tema || ''
    ).trim();

  var conteudo =
    String(
      dados.conteudo || ''
    ).trim();

  var local =
    String(
      dados.local || ''
    ).trim();

  var responsavel =
    String(
      dados.responsavel || ''
    ).trim();

  var observacoes =
    String(
      dados.observacoes || ''
    ).trim();

  if (!tema) {

    throw new Error(
      'Informe o tema do DDS.'
    );
  }

  if (!local) {

    throw new Error(
      'Informe o local do DDS.'
    );
  }

  if (!responsavel) {

    throw new Error(
      'Informe o responsável pelo DDS.'
    );
  }

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.DDS
      );

  if (!sheet) {

    throw new Error(
      'Aba DDS não encontrada.'
    );
  }

  var agora =
    new Date();

  var diaSemana =
    obterDiaSemanaTexto(
      agora
    );

  var semanaId =
    obterSemanaId(
      agora
    );

  var idDDS =
    gerarIdDDS(
      agora
    );

  sheet.appendRow([

    idDDS,

    semanaId,

    agora,

    agora,

    diaSemana,

    tema,

    conteudo,

    local,

    responsavel,

    observacoes,

    'ABERTO',

    agora

  ]);

  var linha =
    sheet.getLastRow();

  sheet
    .getRange(
      linha,
      3
    )
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  sheet
    .getRange(
      linha,
      4
    )
    .setNumberFormat(
      'HH:mm:ss'
    );

  sheet
    .getRange(
      linha,
      12
    )
    .setNumberFormat(
      'dd/MM/yyyy HH:mm:ss'
    );

  SpreadsheetApp.flush();

  Logger.log('==============================================');
  Logger.log('DDS CRIADO');
  Logger.log('ID_DDS=' + idDDS);
  Logger.log('SEMANA_ID=' + semanaId);
  Logger.log('DATA=' + formatarDataDDPS(agora));
  Logger.log('HORARIO=' + formatarHoraDDPS(agora));
  Logger.log('DIA_SEMANA=' + diaSemana);
  Logger.log('TEMA=' + tema);
  Logger.log('LOCAL=' + local);
  Logger.log('RESPONSAVEL=' + responsavel);
  Logger.log('STATUS=ABERTO');
  Logger.log('==============================================');

  return {

    sucesso: true,

    idDDS:
      idDDS,

    semanaId:
      semanaId,

    data:
      agora,

    diaSemana:
      diaSemana,

    tema:
      tema,

    conteudo:
      conteudo,

    local:
      local,

    responsavel:
      responsavel,

    observacoes:
      observacoes,

    status:
      'ABERTO'
  };
}


/* ============================================================
 * GERAR ID DDS
 * ============================================================ */

function gerarIdDDS(data) {

  var ano =
    data.getFullYear();

  var mes =
    String(
      data.getMonth() + 1
    ).padStart(2, '0');

  var dia =
    String(
      data.getDate()
    ).padStart(2, '0');

  var hora =
    String(
      data.getHours()
    ).padStart(2, '0');

  var minuto =
    String(
      data.getMinutes()
    ).padStart(2, '0');

  var segundo =
    String(
      data.getSeconds()
    ).padStart(2, '0');

  var aleatorio =
    Math.floor(
      Math.random() * 1000
    );

  return (
    'DDS-' +
    ano +
    mes +
    dia +
    '-' +
    hora +
    minuto +
    segundo +
    '-' +
    String(
      aleatorio
    ).padStart(3, '0')
  );
}


/* ============================================================
 * SEMANA ID
 * ============================================================ */

function obterSemanaId(data) {

  var d =
    new Date(data);

  var dia =
    d.getDay();

  var diferenca;

  if (dia === 0) {

    diferenca = -6;

  } else {

    diferenca = 1 - dia;
  }

  d.setDate(
    d.getDate() + diferenca
  );

  var ano =
    d.getFullYear();

  var mes =
    String(
      d.getMonth() + 1
    ).padStart(2, '0');

  var diaMes =
    String(
      d.getDate()
    ).padStart(2, '0');

  return (
    ano +
    mes +
    diaMes
  );
}


/* ============================================================
 * DIA DA SEMANA
 * ============================================================ */

function obterDiaSemanaTexto(data) {

  var dias = [

    'DOMINGO',
    'SEGUNDA-FEIRA',
    'TERÇA-FEIRA',
    'QUARTA-FEIRA',
    'QUINTA-FEIRA',
    'SEXTA-FEIRA',
    'SÁBADO'

  ];

  return dias[
    data.getDay()
  ];
}


/* ============================================================
 * OBTER DDS
 * ============================================================ */

function obterDDS(idDDS) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  if (!idDDS) {

    throw new Error(
      'Informe o ID_DDS.'
    );
  }

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.DDS
      );

  if (!sheet) {

    throw new Error(
      'Aba DDS não encontrada.'
    );
  }

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        12
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    if (
      String(
        dados[i][0]
      ).trim() === idDDS
    ) {

      return {

        idDDS:
          String(
            dados[i][0]
          ).trim(),

        semanaId:
          String(
            dados[i][1] || ''
          ).trim(),

        data:
          dados[i][2],

        horario:
          dados[i][3],

        diaSemana:
          String(
            dados[i][4] || ''
          ).trim(),

        tema:
          String(
            dados[i][5] || ''
          ).trim(),

        conteudo:
          String(
            dados[i][6] || ''
          ).trim(),

        local:
          String(
            dados[i][7] || ''
          ).trim(),

        responsavel:
          String(
            dados[i][8] || ''
          ).trim(),

        observacoes:
          String(
            dados[i][9] || ''
          ).trim(),

        status:
          String(
            dados[i][10] || ''
          ).trim(),

        dataCriacao:
          dados[i][11]
      };
    }
  }

  return null;
}


/* ============================================================
 * LISTAR DDS
 * ============================================================ */

function listarDDS() {

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.DDS
      );

  if (!sheet) {

    throw new Error(
      'Aba DDS não encontrada.'
    );
  }

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {

    return {

      sucesso: true,

      dds: []

    };
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        12
      )
      .getValues();

  var lista = [];

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    if (!dados[i][0]) {
      continue;
    }

    lista.push({

      idDDS:
        String(
          dados[i][0]
        ).trim(),

      semanaId:
        String(
          dados[i][1] || ''
        ).trim(),

      data:
        dados[i][2],

      horario:
        dados[i][3],

      diaSemana:
        String(
          dados[i][4] || ''
        ).trim(),

      tema:
        String(
          dados[i][5] || ''
        ).trim(),

      conteudo:
        String(
          dados[i][6] || ''
        ).trim(),

      local:
        String(
          dados[i][7] || ''
        ).trim(),

      responsavel:
        String(
          dados[i][8] || ''
        ).trim(),

      observacoes:
        String(
          dados[i][9] || ''
        ).trim(),

      status:
        String(
          dados[i][10] || ''
        ).trim(),

      dataCriacao:
        dados[i][11]
    });
  }

  return {

    sucesso: true,

    dds:
      lista
  };
}


/* ============================================================
 * FINALIZAR DDS
 * ============================================================ */

function finalizarDDS(idDDS) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  if (!idDDS) {

    throw new Error(
      'Informe o ID_DDS.'
    );
  }

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.DDS
      );

  if (!sheet) {

    throw new Error(
      'Aba DDS não encontrada.'
    );
  }

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {

    throw new Error(
      'Nenhum DDS cadastrado.'
    );
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        12
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    if (
      String(
        dados[i][0]
      ).trim() === idDDS
    ) {

      var linha =
        i + 2;

      sheet
        .getRange(
          linha,
          11
        )
        .setValue(
          'FINALIZADO'
        );

      SpreadsheetApp.flush();

      Logger.log(
        'DDS FINALIZADO -> ' +
        idDDS
      );

      return {

        sucesso: true,

        idDDS:
          idDDS,

        status:
          'FINALIZADO'
      };
    }
  }

  throw new Error(
    'DDS não encontrado: ' +
    idDDS
  );
}


/* ============================================================
 * FORMATADORES
 * ============================================================ */

function formatarDataDDPS(data) {

  return Utilities
    .formatDate(
      data,
      Session.getScriptTimeZone(),
      'dd/MM/yyyy'
    );
}


function formatarHoraDDPS(data) {

  return Utilities
    .formatDate(
      data,
      Session.getScriptTimeZone(),
      'HH:mm:ss'
    );
}


/* ============================================================
 * TESTE DDS
 * ============================================================ */

function TESTAR_DDS() {

  Logger.log('==============================================');
  Logger.log('TESTE DA ETAPA 3 — DDS');
  Logger.log('==============================================');

  var resultado =
    criarDDS({

      tema:
        'TESTE — DDS DE SEGURANÇA',

      conteudo:
        'Teste inicial do novo sistema DDPS.',

      local:
        'LOCAL DE TESTE',

      responsavel:
        'RESPONSÁVEL TESTE',

      observacoes:
        'Registro criado automaticamente para teste.'

    });

  Logger.log(
    'DDS CRIADO -> ' +
    resultado.idDDS
  );

  var encontrado =
    obterDDS(
      resultado.idDDS
    );

  if (!encontrado) {

    throw new Error(
      'ERRO: DDS criado não foi encontrado.'
    );
  }

  Logger.log(
    'DDS ENCONTRADO -> ' +
    encontrado.idDDS
  );

  Logger.log(
    'DIA -> ' +
    encontrado.diaSemana
  );

  Logger.log(
    'SEMANA_ID -> ' +
    encontrado.semanaId
  );

  var finalizado =
    finalizarDDS(
      resultado.idDDS
    );

  Logger.log(
    'STATUS FINAL -> ' +
    finalizado.status
  );

  Logger.log('==============================================');
  Logger.log('TESTE DA ETAPA 3 CONCLUÍDO');
  Logger.log('==============================================');
}


/* ============================================================
 * PARTICIPANTES
 * ============================================================ */


/* ============================================================
 * REGISTRAR PARTICIPANTE
 * ============================================================ */

function registrarParticipante(
  idDDS,
  idFuncionario,
  emociograma
) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  idFuncionario =
    String(
      idFuncionario || ''
    )
    .trim()
    .toUpperCase();

  emociograma =
    normalizarEmociograma(
      emociograma
    );

  if (!idDDS) {

    throw new Error(
      'Informe o ID_DDS.'
    );
  }

  if (!idFuncionario) {

    throw new Error(
      'Informe o ID_FUNCIONARIO.'
    );
  }

  if (!emociograma) {

    throw new Error(
      'Emociograma inválido. Use BOM, REGULAR ou RUIM.'
    );
  }


  /* ----------------------------------------------------------
   * VERIFICA DDS
   * ---------------------------------------------------------- */

  var dds =
    obterDDS(idDDS);

  if (!dds) {

    throw new Error(
      'DDS não encontrado: ' +
      idDDS
    );
  }

  if (
    String(
      dds.status || ''
    ).toUpperCase() ===
    'FINALIZADO'
  ) {

    throw new Error(
      'O DDS já está finalizado e não aceita novos participantes.'
    );
  }


  /* ----------------------------------------------------------
   * FUNCIONÁRIO
   * ---------------------------------------------------------- */

  var funcionario =
    obterFuncionario(
      idFuncionario
    );

  if (!funcionario) {

    throw new Error(
      'Funcionário não encontrado: ' +
      idFuncionario
    );
  }

  if (!funcionario.ativo) {

    throw new Error(
      'Funcionário está inativo: ' +
      idFuncionario
    );
  }


  /* ----------------------------------------------------------
   * ABA PARTICIPANTES
   * ---------------------------------------------------------- */

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.PARTICIPANTES
      );

  if (!sheet) {

    throw new Error(
      'Aba PARTICIPANTES não encontrada.'
    );
  }

  var ultimaLinha =
    sheet.getLastRow();

  var linhaExistente =
    null;


  /* ----------------------------------------------------------
   * PROCURA PARTICIPANTE
   * ---------------------------------------------------------- */

  if (ultimaLinha >= 2) {

    var dados =
      sheet
        .getRange(
          2,
          1,
          ultimaLinha - 1,
          6
        )
        .getValues();

    for (
      var i = 0;
      i < dados.length;
      i++
    ) {

      var ddsLinha =
        String(
          dados[i][0] || ''
        ).trim();

      var funcionarioLinha =
        String(
          dados[i][1] || ''
        )
        .trim()
        .toUpperCase();

      if (
        ddsLinha === idDDS &&
        funcionarioLinha === idFuncionario
      ) {

        linhaExistente =
          i + 2;

        break;
      }
    }
  }


  var agora =
    new Date();


  /* ----------------------------------------------------------
   * PARTICIPANTE EXISTENTE
   * ---------------------------------------------------------- */

  if (linhaExistente) {

    /*
     * Primeiro tenta obter a assinatura oficial
     * da aba ASSINATURAS.
     */

    var assinaturaBanco =
      obterAssinatura(
        idDDS,
        idFuncionario
      );

    var assinaturaExistente =
      '';

    if (
      assinaturaBanco &&
      assinaturaBanco.arquivo
    ) {

      assinaturaExistente =
        assinaturaBanco.arquivo;

    } else {

      assinaturaExistente =
        sheet
          .getRange(
            linhaExistente,
            5
          )
          .getValue();
    }


    /* --------------------------------------------------------
     * ATUALIZA SEM APAGAR ASSINATURA
     * -------------------------------------------------------- */

    sheet
      .getRange(
        linhaExistente,
        1,
        1,
        6
      )
      .setValues([[
        idDDS,
        funcionario.idFuncionario,
        funcionario.nome,
        emociograma,
        assinaturaExistente,
        agora
      ]]);


    sheet
      .getRange(
        linhaExistente,
        6
      )
      .setNumberFormat(
        'dd/MM/yyyy HH:mm:ss'
      );


    SpreadsheetApp.flush();


    Logger.log(
      'PARTICIPANTE ATUALIZADO -> ' +
      idDDS +
      ' | ' +
      funcionario.idFuncionario +
      ' | ' +
      emociograma +
      ' | assinatura preservada=' +
      (
        assinaturaExistente
          ? 'SIM'
          : 'NÃO'
      )
    );


    return {

      sucesso: true,

      acao:
        'ATUALIZADO',

      idDDS:
        idDDS,

      idFuncionario:
        funcionario.idFuncionario,

      nome:
        funcionario.nome,

      emociograma:
        emociograma,

      assinatura:
        assinaturaExistente
    };
  }


  /* ----------------------------------------------------------
   * NOVO PARTICIPANTE
   * ---------------------------------------------------------- */

  sheet.appendRow([

    idDDS,

    funcionario.idFuncionario,

    funcionario.nome,

    emociograma,

    '',

    agora

  ]);


  var novaLinha =
    sheet.getLastRow();


  sheet
    .getRange(
      novaLinha,
      6
    )
    .setNumberFormat(
      'dd/MM/yyyy HH:mm:ss'
    );


  SpreadsheetApp.flush();


  Logger.log(
    'PARTICIPANTE REGISTRADO -> ' +
    idDDS +
    ' | ' +
    funcionario.idFuncionario +
    ' | ' +
    funcionario.nome +
    ' | ' +
    emociograma
  );


  return {

    sucesso: true,

    acao:
      'CRIADO',

    idDDS:
      idDDS,

    idFuncionario:
      funcionario.idFuncionario,

    nome:
      funcionario.nome,

    emociograma:
      emociograma,

    assinatura:
      ''
  };
}


/* ============================================================
 * REGISTRAR PARTICIPANTES EM LOTE
 * ============================================================ */

function registrarParticipantesEmLote(
  idDDS,
  participantes
) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  if (!idDDS) {

    throw new Error(
      'Informe o ID_DDS.'
    );
  }

  if (!Array.isArray(participantes)) {

    throw new Error(
      'A lista de participantes é inválida.'
    );
  }

  if (
    participantes.length === 0
  ) {

    return {

      sucesso: true,

      criados: 0,

      atualizados: 0,

      quantidade: 0
    };
  }

  var criados = 0;
  var atualizados = 0;

  for (
    var i = 0;
    i < participantes.length;
    i++
  ) {

    var participante =
      participantes[i] || {};

    var resultado =
      registrarParticipante(

        idDDS,

        participante.idFuncionario ||
        participante.ID_FUNCIONARIO,

        participante.emociograma ||
        participante.EMOCIOGRAMA

      );

    var assinatura = participante.assinatura || participante.ASSINATURA;
    if (assinatura) {
      try {
        registrarAssinatura(
          idDDS,
          participante.idFuncionario || participante.ID_FUNCIONARIO,
          assinatura
        );
      } catch (errAss) {
        Logger.log('Erro ao registrar assinatura em lote: ' + errAss.message);
      }
    }

    if (
      resultado.acao ===
      'CRIADO'
    ) {

      criados++;

    } else if (
      resultado.acao ===
      'ATUALIZADO'
    ) {

      atualizados++;
    }
  }

  Logger.log(
    'LOTE FINALIZADO -> ' +
    'criados=' + criados +
    ' | atualizados=' + atualizados
  );

  return {

    sucesso: true,

    criados:
      criados,

    atualizados:
      atualizados,

    quantidade:
      participantes.length
  };
}


/* ============================================================
 * OBTER UM PARTICIPANTE
 * ============================================================ */

function obterParticipante(
  idDDS,
  idFuncionario
) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  idFuncionario =
    String(
      idFuncionario || ''
    )
    .trim()
    .toUpperCase();

  if (!idDDS) {

    throw new Error(
      'ID_DDS não informado.'
    );
  }

  if (!idFuncionario) {

    throw new Error(
      'ID_FUNCIONARIO não informado.'
    );
  }

  var ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  var sheet =
    ss.getSheetByName(
      DDPS_ABAS.PARTICIPANTES
    );

  if (!sheet) {

    throw new Error(
      'Aba PARTICIPANTES não encontrada.'
    );
  }

  var lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        6
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    var linha =
      dados[i];

    if (
      String(
        linha[0] || ''
      ).trim() === idDDS &&

      String(
        linha[1] || ''
      )
      .trim()
      .toUpperCase() === idFuncionario
    ) {

      return {

        idDDS:
          linha[0],

        idFuncionario:
          linha[1],

        nome:
          linha[2],

        emociograma:
          linha[3],

        assinatura:
          linha[4],

        dataHora:
          linha[5]
      };
    }
  }

  return null;
}


/* ============================================================
 * OBTER TODOS OS PARTICIPANTES DO DDS
 * ============================================================ */

function obterParticipantesDDS(idDDS) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  if (!idDDS) {

    throw new Error(
      'ID_DDS não informado.'
    );
  }

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.PARTICIPANTES
      );

  if (!sheet) {

    throw new Error(
      'Aba PARTICIPANTES não encontrada.'
    );
  }

  var lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        6
      )
      .getValues();

  var participantes = [];

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    var linha =
      dados[i];

    if (
      String(
        linha[0] || ''
      ).trim() !== idDDS
    ) {
      continue;
    }

    participantes.push({

      idDDS:
        linha[0],

      idFuncionario:
        linha[1],

      nome:
        linha[2],

      emociograma:
        linha[3],

      assinatura:
        linha[4],

      dataHora:
        linha[5]
    });
  }

  return participantes;
}


/* ============================================================
 * REMOVER PARTICIPANTE
 * ============================================================ */

function removerParticipante(
  idDDS,
  idFuncionario
) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  idFuncionario =
    String(
      idFuncionario || ''
    )
    .trim()
    .toUpperCase();

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.PARTICIPANTES
      );

  if (!sheet) {

    throw new Error(
      'Aba PARTICIPANTES não encontrada.'
    );
  }

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {

    throw new Error(
      'Participante não encontrado.'
    );
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        2
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    var ddsLinha =
      String(
        dados[i][0] || ''
      ).trim();

    var funcionarioLinha =
      String(
        dados[i][1] || ''
      )
      .trim()
      .toUpperCase();

    if (
      ddsLinha === idDDS &&
      funcionarioLinha === idFuncionario
    ) {

      var linha =
        i + 2;

      sheet.deleteRow(
        linha
      );

      SpreadsheetApp.flush();

      Logger.log(
        'PARTICIPANTE REMOVIDO -> ' +
        idDDS +
        ' | ' +
        idFuncionario
      );

      return {

        sucesso: true,

        idDDS:
          idDDS,

        idFuncionario:
          idFuncionario
      };
    }
  }

  throw new Error(
    'Participante não encontrado: ' +
    idFuncionario
  );
}


/* ============================================================
 * NORMALIZAR EMOCIOGRAMA
 * ============================================================ */

function normalizarEmociograma(
  valor
) {

  var texto =
    String(
      valor || ''
    )
    .trim()
    .toUpperCase();

  texto =
    texto
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );

  if (
    texto === 'BOM' ||
    texto.indexOf('BOM') !== -1 ||
    texto.indexOf('BEM') !== -1 ||
    texto.indexOf('OTIMO') !== -1 ||
    texto.indexOf('🙂') !== -1 ||
    texto.indexOf('😀') !== -1 ||
    texto === '1'
  ) {
    return 'BOM';
  }

  if (
    texto === 'REGULAR' ||
    texto.indexOf('REGULAR') !== -1 ||
    texto.indexOf('MEDIO') !== -1 ||
    texto.indexOf('😐') !== -1 ||
    texto === '2'
  ) {
    return 'REGULAR';
  }

  if (
    texto === 'RUIM' ||
    texto.indexOf('RUIM') !== -1 ||
    texto.indexOf('MAL') !== -1 ||
    texto.indexOf('TRISTE') !== -1 ||
    texto.indexOf('🙁') !== -1 ||
    texto.indexOf('😞') !== -1 ||
    texto.indexOf('😟') !== -1 ||
    texto === '3'
  ) {
    return 'RUIM';
  }

  return '';
}

/* ============================================================
 * TESTE PARTICIPANTES
 * ============================================================ */

function TESTAR_PARTICIPANTES() {

  Logger.log('==============================================');
  Logger.log('TESTE DA ETAPA 4 — PARTICIPANTES');
  Logger.log('==============================================');

  var dadosDDS = {

    tema:
      'TESTE PARTICIPANTES',

    conteudo:
      'Teste automático da etapa de participantes.',

    local:
      'LOCAL TESTE',

    responsavel:
      'RESPONSAVEL TESTE',

    observacoes:
      'DDS criado automaticamente para teste.'
  };

  var resultadoDDS =
    criarDDS(
      dadosDDS
    );

  var idDDS =
    resultadoDDS.idDDS;

  Logger.log(
    'DDS NOVO DO TESTE -> ' +
    idDDS
  );


  var participantes = [

    {
      idFuncionario:
        'FUNC-001',

      emociograma:
        'BOM'
    },

    {
      idFuncionario:
        'FUNC-002',

      emociograma:
        'REGULAR'
    },

    {
      idFuncionario:
        'FUNC-003',

      emociograma:
        'BOM'
    }

  ];


  Logger.log('');
  Logger.log(
    'CADASTRANDO 3 PARTICIPANTES...'
  );


  var resultado1 =
    registrarParticipantesEmLote(
      idDDS,
      participantes
    );


  Logger.log(
    'CRIADOS -> ' +
    resultado1.criados
  );

  Logger.log(
    'ATUALIZADOS -> ' +
    resultado1.atualizados
  );


  Logger.log('');
  Logger.log(
    'REPETINDO FUNC-001...'
  );


  var resultado2 =
    registrarParticipante(
      idDDS,
      'FUNC-001',
      'BOM'
    );


  Logger.log(
    'RESULTADO REPETIÇÃO -> ' +
    JSON.stringify(
      resultado2
    )
  );


  var lista =
    obterParticipantesDDS(
      idDDS
    );


  Logger.log('');
  Logger.log(
    'TOTAL REAL NO DDS -> ' +
    lista.length
  );


  Logger.log('');
  Logger.log(
    'PARTICIPANTES ENCONTRADOS:'
  );


  lista.forEach(
    function(p, index) {

      Logger.log(
        (index + 1) +
        ' -> ' +
        p.idFuncionario +
        ' | ' +
        p.nome +
        ' | ' +
        p.emociograma +
        ' | assinatura=' +
        (
          p.assinatura
            ? 'SIM'
            : 'NÃO'
        )
      );

    }
  );


  Logger.log('');
  Logger.log('==============================================');
  Logger.log('RESULTADO ESPERADO');
  Logger.log('==============================================');
  Logger.log('TOTAL REAL NO DDS -> 3');
  Logger.log('FUNC-001 -> BOM');
  Logger.log('FUNC-002 -> REGULAR');
  Logger.log('FUNC-003 -> BOM');
  Logger.log('FUNC-001 repetido -> NÃO DEVE CRIAR DUPLICADO');
  Logger.log('==============================================');
}


/* ============================================================
 * ASSINATURAS
 * ============================================================ */


/* ============================================================
 * GERAR ID ASSINATURA
 * ============================================================ */

function gerarIdAssinatura() {

  var agora =
    new Date();

  var ano =
    agora.getFullYear();

  var mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, '0');

  var dia =
    String(
      agora.getDate()
    ).padStart(2, '0');

  var hora =
    String(
      agora.getHours()
    ).padStart(2, '0');

  var minuto =
    String(
      agora.getMinutes()
    ).padStart(2, '0');

  var segundo =
    String(
      agora.getSeconds()
    ).padStart(2, '0');

  var numero =
    Math.floor(
      Math.random() * 1000
    )
    .toString()
    .padStart(3, '0');

  return (
    'ASS-' +
    ano +
    mes +
    dia +
    '-' +
    hora +
    minuto +
    segundo +
    '-' +
    numero
  );
}


/* ============================================================
 * REGISTRAR ASSINATURA
 * ============================================================ */

function registrarAssinatura(
  idDDS,
  idFuncionario,
  arquivo
) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  idFuncionario =
    String(
      idFuncionario || ''
    )
    .trim()
    .toUpperCase();

  arquivo =
    String(
      arquivo || ''
    ).trim();


  if (!idDDS) {

    throw new Error(
      'ID_DDS não informado.'
    );
  }

  if (!idFuncionario) {

    throw new Error(
      'ID_FUNCIONARIO não informado.'
    );
  }

  if (!arquivo) {

    throw new Error(
      'Arquivo da assinatura não informado.'
    );
  }


  /* ----------------------------------------------------------
   * VERIFICA DDS
   * ---------------------------------------------------------- */

  var dds =
    obterDDS(idDDS);

  if (!dds) {

    throw new Error(
      'DDS não encontrado: ' +
      idDDS
    );
  }

  if (
    String(
      dds.status || ''
    ).toUpperCase() ===
    'FINALIZADO'
  ) {

    throw new Error(
      'O DDS já está finalizado e não aceita novas assinaturas.'
    );
  }


  /* ----------------------------------------------------------
   * VERIFICA FUNCIONÁRIO
   * ---------------------------------------------------------- */

  var funcionario =
    obterFuncionario(
      idFuncionario
    );

  if (!funcionario) {

    throw new Error(
      'Funcionário não encontrado: ' +
      idFuncionario
    );
  }

  if (!funcionario.ativo) {

    throw new Error(
      'Funcionário inativo: ' +
      funcionario.nome
    );
  }


  /* ----------------------------------------------------------
   * VERIFICA PARTICIPAÇÃO
   * ---------------------------------------------------------- */

  var participante =
    obterParticipante(
      idDDS,
      idFuncionario
    );

  if (!participante) {

    throw new Error(
      'O funcionário não está registrado como participante deste DDS.'
    );
  }


  /* ----------------------------------------------------------
   * ABA ASSINATURAS
   * ---------------------------------------------------------- */

  var ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  var sheet =
    ss.getSheetByName(
      DDPS_ABAS.ASSINATURAS
    );

  if (!sheet) {

    throw new Error(
      'Aba ASSINATURAS não encontrada.'
    );
  }

  var lastRow =
    sheet.getLastRow();


  /* ----------------------------------------------------------
   * PROCURA ASSINATURA EXISTENTE
   * ---------------------------------------------------------- */

  if (lastRow >= 2) {

    var dados =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          5
        )
        .getValues();

    for (
      var i = 0;
      i < dados.length;
      i++
    ) {

      var linha =
        dados[i];

      if (
        String(
          linha[1] || ''
        ).trim() === idDDS &&

        String(
          linha[2] || ''
        )
        .trim()
        .toUpperCase() === idFuncionario
      ) {

        var agoraAtualizacao =
          new Date();

        /*
         * Atualiza somente ARQUIVO e DATA_HORA
         * na aba ASSINATURAS.
         */

        sheet
          .getRange(
            i + 2,
            4,
            1,
            2
          )
          .setValues([[
            arquivo,
            agoraAtualizacao
          ]]);

        sheet
          .getRange(
            i + 2,
            5
          )
          .setNumberFormat(
            'dd/MM/yyyy HH:mm:ss'
          );


        /*
         * SINCRONIZA A ASSINATURA
         * NA ABA PARTICIPANTES.
         */

        sincronizarAssinaturaParticipante(
          idDDS,
          idFuncionario,
          arquivo
        );


        SpreadsheetApp.flush();


        Logger.log(
          'ASSINATURA ATUALIZADA -> ' +
          idDDS +
          ' | ' +
          idFuncionario
        );


        return {

          sucesso: true,

          acao:
            'ATUALIZADA',

          idAssinatura:
            linha[0],

          idDDS:
            idDDS,

          idFuncionario:
            idFuncionario,

          arquivo:
            arquivo
        };
      }
    }
  }


  /* ----------------------------------------------------------
   * NOVA ASSINATURA
   * ---------------------------------------------------------- */

  var idAssinatura =
    gerarIdAssinatura();

  var agora =
    new Date();

  sheet.appendRow([

    idAssinatura,

    idDDS,

    idFuncionario,

    arquivo,

    agora

  ]);


  sheet
    .getRange(
      sheet.getLastRow(),
      5
    )
    .setNumberFormat(
      'dd/MM/yyyy HH:mm:ss'
    );


  /*
   * SINCRONIZA A ASSINATURA
   * NA ABA PARTICIPANTES.
   */

  sincronizarAssinaturaParticipante(
    idDDS,
    idFuncionario,
    arquivo
  );


  SpreadsheetApp.flush();


  Logger.log(
    'ASSINATURA REGISTRADA -> ' +
    idAssinatura +
    ' | ' +
    idDDS +
    ' | ' +
    idFuncionario
  );


  return {

    sucesso: true,

    acao:
      'CRIADA',

    idAssinatura:
      idAssinatura,

    idDDS:
      idDDS,

    idFuncionario:
      idFuncionario,

    arquivo:
      arquivo
  };
}


/* ============================================================
 * SINCRONIZAR ASSINATURA NO PARTICIPANTE
 * ============================================================ */

function sincronizarAssinaturaParticipante(
  idDDS,
  idFuncionario,
  arquivo
) {

  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.PARTICIPANTES
      );

  if (!sheet) {

    throw new Error(
      'Aba PARTICIPANTES não encontrada.'
    );
  }

  var lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {

    throw new Error(
      'Participante não encontrado para sincronização da assinatura.'
    );
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        6
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    var ddsLinha =
      String(
        dados[i][0] || ''
      ).trim();

    var funcionarioLinha =
      String(
        dados[i][1] || ''
      )
      .trim()
      .toUpperCase();

    if (
      ddsLinha === idDDS &&
      funcionarioLinha === idFuncionario
    ) {

      /*
       * COLUNA E = ASSINATURA
       */

      sheet
        .getRange(
          i + 2,
          5
        )
        .setValue(
          arquivo
        );

      Logger.log(
        'ASSINATURA SINCRONIZADA EM PARTICIPANTES -> ' +
        idDDS +
        ' | ' +
        idFuncionario
      );

      return true;
    }
  }

  throw new Error(
    'Participante não encontrado para sincronização da assinatura.'
  );
}


/* ============================================================
 * OBTER ASSINATURA
 * ============================================================ */

function obterAssinatura(
  idDDS,
  idFuncionario
) {

  idDDS =
    String(
      idDDS || ''
    ).trim();

  idFuncionario =
    String(
      idFuncionario || ''
    )
    .trim()
    .toUpperCase();

  if (!idDDS) {

    throw new Error(
      'ID_DDS não informado.'
    );
  }

  if (!idFuncionario) {

    throw new Error(
      'ID_FUNCIONARIO não informado.'
    );
  }

  var ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  var sheet =
    ss.getSheetByName(
      DDPS_ABAS.ASSINATURAS
    );

  if (!sheet) {

    throw new Error(
      'Aba ASSINATURAS não encontrada.'
    );
  }

  var lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  var dados =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        5
      )
      .getValues();

  for (
    var i = 0;
    i < dados.length;
    i++
  ) {

    var linha =
      dados[i];

    if (
      String(
        linha[1] || ''
      ).trim() === idDDS &&

      String(
        linha[2] || ''
      )
      .trim()
      .toUpperCase() === idFuncionario
    ) {

      return {

        idAssinatura:
          linha[0],

        idDDS:
          linha[1],

        idFuncionario:
          linha[2],

        arquivo:
          linha[3],

        dataHora:
          linha[4]
      };
    }
  }

  return null;
}


/* ============================================================
 * TESTE FUNCIONÁRIO ASSINATURA
 * ============================================================ */

function TESTAR_FUNCIONARIO_ASSINATURA() {

  Logger.log('==============================================');
  Logger.log('DIAGNÓSTICO FUNC-001');
  Logger.log('==============================================');

  var funcionario =
    obterFuncionario(
      'FUNC-001'
    );

  if (!funcionario) {

    throw new Error(
      'FUNC-001 NÃO ENCONTRADO'
    );
  }

  Logger.log(
    'ID -> ' +
    funcionario.idFuncionario
  );

  Logger.log(
    'NOME -> ' +
    funcionario.nome
  );

  Logger.log(
    'ATIVO -> [' +
    funcionario.ativo +
    ']'
  );

  Logger.log(
    'TIPO ATIVO -> ' +
    typeof funcionario.ativo
  );

  Logger.log(
    'ATIVO UPPER -> [' +
    String(
      funcionario.ativo
    ).toUpperCase() +
    ']'
  );

  Logger.log('==============================================');
}


/* ============================================================
 * TESTE ASSINATURAS
 * ============================================================ */

function TESTAR_ASSINATURAS() {

  Logger.log('==============================================');
  Logger.log('TESTE DA ETAPA 5 — ASSINATURAS');
  Logger.log('==============================================');

  var dadosDDS = {

    tema:
      'TESTE ASSINATURAS',

    conteudo:
      'Teste automático da etapa de assinaturas.',

    local:
      'LOCAL TESTE',

    responsavel:
      'RESPONSAVEL TESTE',

    observacoes:
      'DDS criado automaticamente para teste.'
  };

  var resultadoDDS =
    criarDDS(
      dadosDDS
    );

  var idDDS =
    resultadoDDS.idDDS;

  Logger.log(
    'DDS DO TESTE -> ' +
    idDDS
  );


  Logger.log('');
  Logger.log(
    'REGISTRANDO PARTICIPANTE...'
  );


  registrarParticipante(
    idDDS,
    'FUNC-001',
    'BOM'
  );


  Logger.log(
    'PARTICIPANTE PRONTO PARA ASSINATURA'
  );


  Logger.log('');
  Logger.log(
    'REGISTRANDO PRIMEIRA ASSINATURA...'
  );


  var resultado1 =
    registrarAssinatura(
      idDDS,
      'FUNC-001',
      'TESTE_ASSINATURA_001'
    );


  Logger.log(
    'AÇÃO -> ' +
    resultado1.acao
  );

  Logger.log(
    'ID_ASSINATURA -> ' +
    resultado1.idAssinatura
  );


  Logger.log('');
  Logger.log(
    'CONSULTANDO ASSINATURA...'
  );


  var assinatura =
    obterAssinatura(
      idDDS,
      'FUNC-001'
    );


  if (!assinatura) {

    throw new Error(
      'ASSINATURA NÃO FOI ENCONTRADA.'
    );
  }


  Logger.log(
    'ID_ASSINATURA -> ' +
    assinatura.idAssinatura
  );

  Logger.log(
    'ID_DDS -> ' +
    assinatura.idDDS
  );

  Logger.log(
    'ID_FUNCIONARIO -> ' +
    assinatura.idFuncionario
  );

  Logger.log(
    'ARQUIVO -> ' +
    assinatura.arquivo
  );


  Logger.log('');
  Logger.log(
    'ATUALIZANDO ASSINATURA...'
  );


  var resultado2 =
    registrarAssinatura(
      idDDS,
      'FUNC-001',
      'TESTE_ASSINATURA_002'
    );


  Logger.log(
    'AÇÃO SEGUNDA ASSINATURA -> ' +
    resultado2.acao
  );


  var assinaturaFinal =
    obterAssinatura(
      idDDS,
      'FUNC-001'
    );


  Logger.log('');
  Logger.log(
    'ARQUIVO FINAL -> ' +
    assinaturaFinal.arquivo
  );


  /*
   * VERIFICA TAMBÉM PARTICIPANTES.
   */

  var participanteFinal =
    obterParticipante(
      idDDS,
      'FUNC-001'
    );


  Logger.log(
    'ASSINATURA EM PARTICIPANTES -> ' +
    participanteFinal.assinatura
  );


  var sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        DDPS_ABAS.ASSINATURAS
      );

  var total = 0;

  if (sheet.getLastRow() >= 2) {

    var dados =
      sheet
        .getRange(
          2,
          1,
          sheet.getLastRow() - 1,
          5
        )
        .getValues();

    for (
      var i = 0;
      i < dados.length;
      i++
    ) {

      if (
        String(
          dados[i][1] || ''
        ).trim() === idDDS &&

        String(
          dados[i][2] || ''
        )
        .trim()
        .toUpperCase() ===
        'FUNC-001'
      ) {

        total++;
      }
    }
  }


  Logger.log('');
  Logger.log(
    'TOTAL DE ASSINATURAS PARA FUNC-001 -> ' +
    total
  );


  Logger.log('');
  Logger.log('==============================================');
  Logger.log('RESULTADO ESPERADO');
  Logger.log('==============================================');
  Logger.log('PRIMEIRA AÇÃO -> CRIADA');
  Logger.log('SEGUNDA AÇÃO -> ATUALIZADA');
  Logger.log('ARQUIVO FINAL -> TESTE_ASSINATURA_002');
  Logger.log('ASSINATURA EM PARTICIPANTES -> TESTE_ASSINATURA_002');
  Logger.log('TOTAL DE ASSINATURAS -> 1');
  Logger.log('==============================================');
}


/* ============================================================
 * TESTE DE PRESERVAÇÃO DA ASSINATURA
 * ============================================================ */

function TESTAR_PRESERVACAO_ASSINATURA() {

  Logger.log('==============================================');
  Logger.log('TESTE DE PRESERVAÇÃO DA ASSINATURA');
  Logger.log('==============================================');


  /* ----------------------------------------------------------
   * 1. CRIAR DDS
   * ---------------------------------------------------------- */

  var resultadoDDS =
    criarDDS({

      tema:
        'TESTE PRESERVAÇÃO ASSINATURA',

      conteudo:
        'Teste de preservação.',

      local:
        'LOCAL TESTE',

      responsavel:
        'RESPONSAVEL TESTE',

      observacoes:
        'Teste automático.'
    });


  var idDDS =
    resultadoDDS.idDDS;


  Logger.log(
    'DDS -> ' +
    idDDS
  );


  /* ----------------------------------------------------------
   * 2. CRIAR PARTICIPANTE
   * ---------------------------------------------------------- */

  registrarParticipante(
    idDDS,
    'FUNC-001',
    'BOM'
  );


  Logger.log(
    'PARTICIPANTE CRIADO'
  );


  /* ----------------------------------------------------------
   * 3. CRIAR ASSINATURA
   * ---------------------------------------------------------- */

  var assinatura =
    registrarAssinatura(
      idDDS,
      'FUNC-001',
      'ASSINATURA_TESTE_PRESERVAR'
    );


  Logger.log(
    'ASSINATURA CRIADA -> ' +
    assinatura.idAssinatura
  );


  /* ----------------------------------------------------------
   * 4. ALTERAR PARTICIPANTE
   * ---------------------------------------------------------- */

  registrarParticipante(
    idDDS,
    'FUNC-001',
    'REGULAR'
  );


  Logger.log(
    'PARTICIPANTE ATUALIZADO'
  );


  /* ----------------------------------------------------------
   * 5. CONSULTAR PARTICIPANTE
   * ---------------------------------------------------------- */

  var participante =
    obterParticipante(
      idDDS,
      'FUNC-001'
    );


  Logger.log(
    'EMOCIOGRAMA FINAL -> ' +
    participante.emociograma
  );

  Logger.log(
    'ASSINATURA FINAL -> ' +
    participante.assinatura
  );


  /* ----------------------------------------------------------
   * 6. VALIDAR EMOCIOGRAMA
   * ---------------------------------------------------------- */

  if (
    String(
      participante.emociograma
    ) !==
    'REGULAR'
  ) {

    throw new Error(
      'ERRO: O EMOCIOGRAMA NÃO FOI ATUALIZADO!'
    );
  }


  /* ----------------------------------------------------------
   * 7. VALIDAR ASSINATURA
   * ---------------------------------------------------------- */

  if (
    String(
      participante.assinatura
    ) !==
    'ASSINATURA_TESTE_PRESERVAR'
  ) {

    throw new Error(
      'ERRO: A ASSINATURA FOI APAGADA!'
    );
  }


  /* ----------------------------------------------------------
   * 8. VALIDAR ASSINATURA NO BANCO
   * ---------------------------------------------------------- */

  var assinaturaBanco =
    obterAssinatura(
      idDDS,
      'FUNC-001'
    );


  if (!assinaturaBanco) {

    throw new Error(
      'ERRO: ASSINATURA NÃO ENCONTRADA NA ABA ASSINATURAS!'
    );
  }


  if (
    String(
      assinaturaBanco.arquivo
    ) !==
    'ASSINATURA_TESTE_PRESERVAR'
  ) {

    throw new Error(
      'ERRO: ARQUIVO DA ASSINATURA FOI ALTERADO!'
    );
  }


  Logger.log('');
  Logger.log('==============================================');
  Logger.log('TESTE APROVADO');
  Logger.log('==============================================');
  Logger.log('ASSINATURA PRESERVADA -> SIM');
  Logger.log('EMOCIOGRAMA ATUALIZADO -> SIM');
  Logger.log('ASSINATURA NA ABA ASSINATURAS -> SIM');
  Logger.log('==============================================');
}

/**
 * Retorna um DDS completo:
 * DDS + participantes
 */
function obterDDSCompleto(idDDS) {

  Logger.log('==============================================');
  Logger.log('OBTER DDS COMPLETO - DIAGNÓSTICO');
  Logger.log('==============================================');

  Logger.log('ID RECEBIDO: [' + idDDS + ']');

  if (!idDDS) {
    Logger.log('ERRO: ID_DDS VAZIO');

    return {
      sucesso: false,
      erro: 'ID_DDS não informado.'
    };
  }

  var dds = obterDDS(idDDS);

  Logger.log(
    'RETORNO DO obterDDS: ' +
    JSON.stringify(dds)
  );

  if (!dds) {

    Logger.log('ERRO: obterDDS RETORNOU NULL');

    return {
      sucesso: false,
      erro: 'DDS não encontrado.'
    };
  }

  Logger.log('DDS ENCONTRADO: SIM');

  var listaParticipantes =
    obterParticipantesDDS(idDDS) || [];

  Logger.log(
    'RETORNO PARTICIPANTES: ' +
    JSON.stringify(listaParticipantes)
  );

  Logger.log(
    'TOTAL PARTICIPANTES: ' +
    listaParticipantes.length
  );

  return {
    sucesso: true,
    dds: dds,
    participantes: listaParticipantes,
    totalParticipantes: listaParticipantes.length
  };
}

function TESTAR_DDS_COMPLETO() {

  Logger.log('==============================================');
  Logger.log('TESTE DDS COMPLETO');
  Logger.log('==============================================');

  // 1. Criar DDS de teste
  var dadosDDS = {
    data: new Date(),
    horario: '08:00',
    tema: 'TESTE DDS COMPLETO',
    conteudo: 'Teste de retorno completo do DDS.',
    local: 'LOCAL TESTE',
    responsavel: 'RESPONSÁVEL TESTE',
    observacoes: 'Teste automático'
  };

  var resultadoDDS = criarDDS(dadosDDS);

  if (!resultadoDDS || !resultadoDDS.sucesso) {
    Logger.log('ERRO AO CRIAR DDS');
    Logger.log(JSON.stringify(resultadoDDS));
    return;
  }

  var idDDS = resultadoDDS.idDDS;

  Logger.log('DDS CRIADO: ' + idDDS);

  // 2. Criar 3 participantes
  var funcionarios = ['FUNC-001', 'FUNC-002', 'FUNC-003'];

  for (var i = 0; i < funcionarios.length; i++) {

    var resultadoParticipante = registrarParticipante(
      idDDS,
      funcionarios[i],
      'BOM'
    );

    Logger.log(
      'PARTICIPANTE ' +
      funcionarios[i] +
      ': ' +
      JSON.stringify(resultadoParticipante)
    );
  }

  // 3. Buscar DDS completo
  Logger.log('----------------------------------------------');
  Logger.log('BUSCANDO DDS COMPLETO');

  var resultadoCompleto = obterDDSCompleto(idDDS);

  Logger.log('SUCESSO: ' + resultadoCompleto.sucesso);

  if (!resultadoCompleto.sucesso) {
    Logger.log('ERRO: ' + resultadoCompleto.erro);
    return;
  }

  // 4. Validar DDS
  Logger.log('DDS ENCONTRADO: ' + (resultadoCompleto.dds ? 'SIM' : 'NÃO'));

  // 5. Validar participantes
  Logger.log(
    'TOTAL PARTICIPANTES: ' +
    resultadoCompleto.totalParticipantes
  );

  Logger.log(
    'PARTICIPANTES RECEBIDOS: ' +
    JSON.stringify(resultadoCompleto.participantes)
  );

  // 6. Resultado final
  if (resultadoCompleto.totalParticipantes === 3) {

    Logger.log('==============================================');
    Logger.log('TESTE APROVADO');
    Logger.log('DDS + 3 PARTICIPANTES RETORNADOS CORRETAMENTE');
    Logger.log('==============================================');

  } else {

    Logger.log('==============================================');
    Logger.log('TESTE REPROVADO');
    Logger.log(
      'Esperado: 3 participantes | Recebido: ' +
      resultadoCompleto.totalParticipantes
    );
    Logger.log('==============================================');
  }
}

function TESTAR_OBTER_DDS_DIRETO() {

  Logger.log('==============================================');
  Logger.log('TESTE DIRETO DO obterDDS()');
  Logger.log('==============================================');

  var idDDS = 'DDS-20260909-111455-559';

  Logger.log('ID ENVIADO: [' + idDDS + ']');

  var resultado = obterDDS(idDDS);

  Logger.log('----------------------------------------------');
  Logger.log('RESULTADO DO obterDDS():');

  if (resultado === null) {

    Logger.log('RESULTADO = NULL');
    Logger.log('>>> obterDDS() NÃO ENCONTROU O DDS');

  } else {

    Logger.log('RESULTADO ENCONTRADO!');
    Logger.log(JSON.stringify(resultado));

    Logger.log('ID: ' + resultado.idDDS);
    Logger.log('TEMA: ' + resultado.tema);
    Logger.log('STATUS: ' + resultado.status);
  }

  Logger.log('==============================================');
}

function TESTAR_LISTAR_DDS() {
  Logger.log('==============================================');
  Logger.log('TESTE DIRETO listarDDS()');
  Logger.log('==============================================');

  var resultado = listarDDS();

  Logger.log('RESULTADO:');
  Logger.log(JSON.stringify(resultado));

  if (resultado && resultado.dds) {
    Logger.log('TOTAL DDS: ' + resultado.dds.length);

    resultado.dds.forEach(function(dds, index) {
      Logger.log(
        (index + 1) +
        ' -> ' +
        dds.idDDS +
        ' | ' +
        dds.tema
      );
    });
  } else {
    Logger.log('ERRO: retorno não possui propriedade dds');
  }
}

function TESTAR_IMPLANTACAO() {
  var url = 'https://script.google.com/macros/s/AKfycbxsdyIsb8o5BakjYKAdNTHsgJYuQsytNqthVAtNNy-5wIoqQqepDLx0hmW9w5ktojTo/exec';

  var resposta = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true
  });

  Logger.log('STATUS: ' + resposta.getResponseCode());
  Logger.log('RESPOSTA: ' + resposta.getContentText());
}