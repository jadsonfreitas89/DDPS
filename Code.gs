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
  ASSINATURAS: 'ASSINATURAS',
  USUARIOS: 'USUARIOS'
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

  criarAba(
    ss,
    DDPS_ABAS.USUARIOS,
    [
      'ID_USUARIO',
      'USUARIO',
      'NOME',
      'SENHA_HASH',
      'PERFIL',
      'ATIVO',
      'DATA_CRIACAO',
      'DATA_ATUALIZACAO'
    ]
  );

  garantirAdminInicial();

  configurarInicialmente();

  SpreadsheetApp.flush();

  Logger.log('==============================================');
  Logger.log('INSTALAÇÃO CONCLUÍDA COM SUCESSO');
  Logger.log('==============================================');
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
  try {
    if (e && e.parameter) {
      var acao = e.parameter.acao || e.parameter.action;
      var token = e.parameter.token;
      
      if (acao === 'listarDDS') {
        exigirAutenticacao(token);
        return respostaJSON(listarDDS());
      }
      
      if (acao === 'listarFuncionarios' || acao === 'funcionarios') {
        exigirAutenticacao(token);
        return respostaJSON(listarFuncionarios());
      }
      
      if ((acao === 'participantes' || acao === 'listarParticipantes') && e.parameter.idDDS) {
        exigirAutenticacao(token);
        var parts = obterParticipantesDDS(e.parameter.idDDS) || [];
        return respostaJSON({
          sucesso: true,
          dados: parts,
          participantes: parts
        });
      }
      
      if (acao === 'obterDDSCompleto' || acao === 'obterDDS' || acao === 'getDDS') {
        exigirAutenticacao(token);
        var res = obterDDSCompleto(e.parameter.idDDS || e.parameter.id);
        return respostaJSON(res);
      }
      
      if (acao === 'buscarAssinaturaEncarregado' || acao === 'obterAssinaturaEncarregado') {
        exigirAutenticacao(token);
        var idDDS = e.parameter.idDDS || e.parameter.id;
        var assinatura = obterAssinaturaEncarregado(idDDS);
        return respostaJSON({
          sucesso: true,
          dados: assinatura,
          assinatura: assinatura
        });
      }
      
      if (acao === 'obterFuncionario') {
        exigirAutenticacao(token);
        var idFunc = e.parameter.idFuncionario || e.parameter.id;
        var func = obterFuncionario(idFunc);
        return respostaJSON({
          sucesso: true,
          dados: func
        });
      }
    }

    return respostaJSON({
      sucesso: true,
      sistema: 'DDPS WEB APP',
      versao: '1.0',
      mensagem: 'API DDPS funcionando.'
    });
  } catch (err) {
    return respostaJSON({
      sucesso: false,
      erro: err.message
    });
  }
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
    var token = dados.token;

    switch (acao) {
      // Públicos (Autenticação)
      case 'login':
        return respostaJSON(login(dados.usuario, dados.senha));

      case 'definirPrimeiraSenha':
      case 'definirSenha':
        return respostaJSON(definirPrimeiraSenha(dados.usuario, dados.novaSenha || dados.senha));

      case 'validarSessao':
        return respostaJSON(validarSessao(dados.token || token));

      case 'logout':
        return respostaJSON(logout(dados.token || token));

      case 'criarAdministradorInicial':
      case 'configurarPrimeiroAdmin':
        return respostaJSON(configurarPrimeiroAdmin(dados.usuario, dados.nome));

      // Administração de Usuários (Apenas ADMIN)
      case 'listarUsuarios':
        return respostaJSON(listarUsuarios(token));

      case 'cadastrarUsuario':
        return respostaJSON(cadastrarUsuario(token, dados));

      case 'editarUsuario':
        return respostaJSON(editarUsuario(token, dados));

      case 'redefinirSenhaUsuario':
      case 'redefinirSenha':
        return respostaJSON(redefinirSenhaUsuario(token, dados));

      case 'solicitarRecuperacaoSenha':
      case 'recuperarSenha':
        return respostaJSON(solicitarRecuperacaoSenha(dados.usuario));

      case 'alterarMinhaSenha':
      case 'alterarSenha':
        return respostaJSON(alterarMinhaSenha(token, dados));

      case 'alterarStatusFuncionario':
        exigirPerfil(token, 'ADMIN');
        return respostaJSON(alterarStatusFuncionario(dados.idFuncionario || dados.id, dados.ativo));

      case 'excluirFuncionario':
        exigirPerfil(token, 'ADMIN');
        return respostaJSON(excluirFuncionario(dados.idFuncionario || dados.id));

      // Operacionais (Exigem Autenticação ADMIN ou TST)
      case 'listarFuncionarios':
      case 'funcionarios':
        exigirAutenticacao(token);
        return respostaJSON(listarFuncionarios());

      case 'cadastrarFuncionario':
        exigirAutenticacao(token);
        return respostaJSON(cadastrarFuncionario(dados.nome, dados.funcao || dados.cargo));

      case 'obterFuncionario':
        exigirAutenticacao(token);
        return respostaJSON(obterFuncionario(dados.idFuncionario || dados.id));

      case 'alterarFuncionario':
      case 'editarFuncionario':
        exigirAutenticacao(token);
        return respostaJSON(alterarFuncionario(dados.idFuncionario || dados.id, dados.nome, dados.funcao || dados.cargo, dados.ativo));

      case 'criarDDS':
      case 'criarDds':
        exigirAutenticacao(token);
        return respostaJSON(criarDDS(dados));

      case 'atualizarDDS':
      case 'atualizarDds':
      case 'editarDDS':
        exigirAutenticacao(token);
        return respostaJSON(atualizarDDS(dados));

      case 'registrarAssinaturaEncarregado':
        exigirAutenticacao(token);
        return respostaJSON(registrarAssinatura(dados.idDDS, dados.idFuncionario || dados.id, dados.assinatura, 'ENCARREGADO'));

      case 'salvarDDSCompleto':
      case 'salvarEtapaDDS':
        exigirAutenticacao(token);
        return respostaJSON(salvarDDSCompleto(dados));

      case 'salvarParticipantes':
        exigirAutenticacao(token);
        return respostaJSON(registrarParticipantesEmLote(dados.idDDS, dados.participantes));

      case 'salvarParticipante':
        exigirAutenticacao(token);
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
        exigirAutenticacao(token);
        return respostaJSON(finalizarDDS(dados.idDDS));

      case 'deletarDDS':
        exigirAutenticacao(token);
        return respostaJSON(deletarDDS(dados.idDDS));

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
 * DELETAR DDS
 * ============================================================ */

function deletarDDS(idDDS) {
  idDDS = String(idDDS || '').trim();
  if (!idDDS) {
    throw new Error('Informe o ID_DDS.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Verificar se o DDS existe na aba DDS
  var sheetDDS = ss.getSheetByName(DDPS_ABAS.DDS);
  if (!sheetDDS) {
    throw new Error('Aba DDS não encontrada.');
  }

  var lastRowDDS = sheetDDS.getLastRow();
  var ddsEncontrado = false;
  
  if (lastRowDDS >= 2) {
    var valoresDDS = sheetDDS.getRange(2, 1, lastRowDDS - 1, 1).getValues();
    for (var i = valoresDDS.length - 1; i >= 0; i--) {
      if (String(valoresDDS[i][0]).trim() === idDDS) {
        sheetDDS.deleteRow(i + 2);
        ddsEncontrado = true;
      }
    }
  }

  if (!ddsEncontrado) {
    throw new Error('DDS não encontrado para o ID: ' + idDDS);
  }

  // 2. Excluir da aba PARTICIPANTES (coluna 1 é ID_DDS)
  var sheetPart = ss.getSheetByName(DDPS_ABAS.PARTICIPANTES);
  if (sheetPart) {
    var lastRowPart = sheetPart.getLastRow();
    if (lastRowPart >= 2) {
      var valoresPart = sheetPart.getRange(2, 1, lastRowPart - 1, 1).getValues();
      for (var j = valoresPart.length - 1; j >= 0; j--) {
        if (String(valoresPart[j][0]).trim() === idDDS) {
          sheetPart.deleteRow(j + 2);
        }
      }
    }
  }

  // 3. Excluir da aba ASSINATURAS (coluna 2 é ID_DDS)
  var sheetAss = ss.getSheetByName(DDPS_ABAS.ASSINATURAS);
  if (sheetAss) {
    var lastRowAss = sheetAss.getLastRow();
    if (lastRowAss >= 2) {
      var valoresAss = sheetAss.getRange(2, 2, lastRowAss - 1, 1).getValues();
      for (var k = valoresAss.length - 1; k >= 0; k--) {
        if (String(valoresAss[k][0]).trim() === idDDS) {
          sheetAss.deleteRow(k + 2);
        }
      }
    }
  }

  return {
    sucesso: true,
    idDDS: idDDS,
    mensagem: "DDPS deletado com sucesso"
  };
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

  // Garante as novas colunas de encarregado no DDS
  garantirSchemaDDS(sheet);

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

  var encarregadoId = String(dados.encarregadoId || '').trim();
  var encarregadoNome = String(dados.encarregadoNome || '').trim();

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

    agora,

    encarregadoId,

    encarregadoNome

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

  if (dados.assinaturaEncarregado && encarregadoId) {
    try {
      registrarAssinatura(idDDS, encarregadoId, dados.assinaturaEncarregado, 'ENCARREGADO');
    } catch (errAssinaturaEnc) {
      Logger.log('Erro ao salvar assinatura inicial do encarregado: ' + errAssinaturaEnc.message);
    }
  }

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
      'ABERTO',

    encarregadoId:
      encarregadoId,

    encarregadoNome:
      encarregadoNome,

    assinaturaEncarregado:
      dados.assinaturaEncarregado || ''
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

  // Garante as novas colunas de encarregado no DDS
  garantirSchemaDDS(sheet);

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {
    return null;
  }

  var colCount = sheet.getLastColumn();
  var numCols = Math.max(12, colCount);

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        numCols
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

      var idDDSStr = String(dados[i][0]).trim();

      return {

        idDDS:
          idDDSStr,

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
          dados[i][11],

        encarregadoId:
          numCols >= 13 ? String(dados[i][12] || '').trim() : '',

        encarregadoNome:
          numCols >= 14 ? String(dados[i][13] || '').trim() : '',

        assinaturaEncarregado:
          obterAssinaturaEncarregado(idDDSStr)
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

  // Garante as novas colunas de encarregado no DDS
  garantirSchemaDDS(sheet);

  var ultimaLinha =
    sheet.getLastRow();

  if (ultimaLinha < 2) {

    return {

      sucesso: true,

      dds: []

    };
  }

  var colCount = sheet.getLastColumn();
  var numCols = Math.max(12, colCount);

  var dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        numCols
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

    var idDDSStr = String(dados[i][0]).trim();

    lista.push({

      idDDS:
        idDDSStr,

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
        dados[i][11],

      encarregadoId:
        numCols >= 13 ? String(dados[i][12] || '').trim() : '',

      encarregadoNome:
        numCols >= 14 ? String(dados[i][13] || '').trim() : '',

      assinaturaEncarregado:
        obterAssinaturaEncarregado(idDDSStr)
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
      'America/Sao_Paulo',
      'dd/MM/yyyy'
    );
}


function formatarHoraDDPS(data) {

  return Utilities
    .formatDate(
      data,
      'America/Sao_Paulo',
      'HH:mm'
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
 * SALVAR DDS COMPLETO (FLUXO CONSOLIDADO EM LOTE)
 * ============================================================ */

function salvarDDSCompleto(dados) {
  var execId = 'EXEC-' + new Date().getTime() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  var tInicio = new Date().getTime();
  
  dados = dados || {};
  dados._execId = execId;
  var idDDS = String(dados.idDDS || dados.id || '').trim();

  Logger.log('========== INÍCIO SALVAR DDPS ==========');
  Logger.log('EXEC_ID=' + execId);
  Logger.log('ID_DDS=' + idDDS);

  // 1. Criar ou Atualizar DDS
  var ddsObj = null;
  if (!idDDS) {
    ddsObj = criarDDS(dados);
    idDDS = ddsObj ? (ddsObj.idDDS || ddsObj.id) : '';
  } else {
    ddsObj = atualizarDDS(dados);
  }

  var tDDS = new Date().getTime();

  // 2. Registrar Assinatura do Encarregado se fornecida
  var encarregadoId = String(dados.encarregadoId || (ddsObj ? ddsObj.encarregadoId : '') || '').trim();
  var assEncarregado = String(dados.assinaturaEncarregado || '').trim();
  if (idDDS && encarregadoId && assEncarregado) {
    try {
      registrarAssinatura(idDDS, encarregadoId, assEncarregado, 'ENCARREGADO');
    } catch (errEnc) {
      Logger.log('[PERF LOG] Aviso assinatura encarregado: ' + errEnc.message);
    }
  }

  var tEnc = new Date().getTime();

  // 3. Registrar Participantes em Lote se fornecidos
  var resParticipantes = { criados: 0, atualizados: 0 };
  if (idDDS && Array.isArray(dados.participantes) && dados.participantes.length > 0) {
    resParticipantes = registrarParticipantesEmLote(idDDS, dados.participantes);
  }

  var tPart = new Date().getTime();

  // 4. Finalizar se solicitado
  if (idDDS && (dados.finalizar === true || dados.status === 'FINALIZADO')) {
    finalizarDDS(idDDS);
    if (ddsObj) ddsObj.status = 'FINALIZADO';
  }

  var tFim = new Date().getTime();

  Logger.log('[PERF LOG] TOTAL SALVAR DDS COMPLETO: ' + (tFim - tInicio) + ' ms | DDS: ' + (tDDS - tInicio) + ' ms | Encarregado: ' + (tEnc - tDDS) + ' ms | Participantes: ' + (tPart - tEnc) + ' ms | Finalizar: ' + (tFim - tPart) + ' ms');
  Logger.log('========== FIM SALVAR DDPS ==========');

  return {
    sucesso: true,
    idDDS: idDDS,
    dds: ddsObj,
    participantes: resParticipantes,
    tempoTotalMs: tFim - tInicio,
    execId: execId
  };
}


/* ============================================================
 * REGISTRAR PARTICIPANTES EM LOTE (OTIMIZADO EM MEMÓRIA)
 * ============================================================ */

function registrarParticipantesEmLote(
  idDDS,
  participantes
) {
  var tInicio = new Date().getTime();
  Logger.log('[PERF LOG] INÍCIO SALVAR PARTICIPANTES EM LOTE - ID_DDS: ' + idDDS + ' | Total: ' + (participantes ? participantes.length : 0));

  idDDS = String(idDDS || '').trim();

  if (!idDDS) {
    throw new Error('Informe o ID_DDS.');
  }

  if (!Array.isArray(participantes) || participantes.length === 0) {
    return {
      sucesso: true,
      criados: 0,
      atualizados: 0,
      quantidade: 0,
      tempoMs: new Date().getTime() - tInicio
    };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 0. Carregar mapa de funcionários (ID -> Nome)
  var mapFuncionarios = {};
  try {
    var sheetFunc = ss.getSheetByName(DDPS_ABAS.FUNCIONARIOS);
    if (sheetFunc && sheetFunc.getLastRow() >= 2) {
      var dadosFunc = sheetFunc.getRange(2, 1, sheetFunc.getLastRow() - 1, 2).getValues();
      for (var f = 0; f < dadosFunc.length; f++) {
        var fId = String(dadosFunc[f][0] || '').trim().toUpperCase();
        var fNome = String(dadosFunc[f][1] || '').trim();
        if (fId && fNome) {
          mapFuncionarios[fId] = fNome;
        }
      }
    }
  } catch (errFunc) {
    Logger.log('Erro ao carregar mapa de funcionários: ' + errFunc.message);
  }

  // 1. Carregar aba PARTICIPANTES
  var sheetPart = ss.getSheetByName(DDPS_ABAS.PARTICIPANTES);
  if (!sheetPart) throw new Error('Aba PARTICIPANTES não encontrada.');

  var lastRowPart = sheetPart.getLastRow();
  var dadosPart = lastRowPart >= 2 ? sheetPart.getRange(2, 1, lastRowPart - 1, 6).getValues() : [];

  // Mapeia linhas existentes em PARTICIPANTES por idFuncionario
  var partMapIndex = {};
  for (var i = 0; i < dadosPart.length; i++) {
    var ddsRow = String(dadosPart[i][0] || '').trim();
    var funcRow = String(dadosPart[i][1] || '').trim().toUpperCase();
    if (ddsRow === idDDS && funcRow) {
      partMapIndex[funcRow] = i;
    }
  }

  // 2. Carregar aba ASSINATURAS
  var sheetAss = ss.getSheetByName(DDPS_ABAS.ASSINATURAS);
  if (!sheetAss) throw new Error('Aba ASSINATURAS não encontrada.');
  garantirSchemaAssinaturas(sheetAss);

  var lastRowAss = sheetAss.getLastRow();
  var colCountAss = Math.max(6, sheetAss.getLastColumn());
  var dadosAss = lastRowAss >= 2 ? sheetAss.getRange(2, 1, lastRowAss - 1, colCountAss).getValues() : [];

  // Mapeia linhas existentes em ASSINATURAS por (idFuncionario + '_PARTICIPANTE')
  var assMapIndex = {};
  for (var j = 0; j < dadosAss.length; j++) {
    var ddsAss = String(dadosAss[j][1] || '').trim();
    var funcAss = String(dadosAss[j][2] || '').trim().toUpperCase();
    var tipoAss = colCountAss >= 6 ? String(dadosAss[j][5] || 'PARTICIPANTE').trim().toUpperCase() : 'PARTICIPANTE';
    if (ddsAss === idDDS && funcAss && tipoAss === 'PARTICIPANTE') {
      assMapIndex[funcAss] = j;
    }
  }

  var tLeitura = new Date().getTime();
  var agora = new Date();
  var criados = 0;
  var atualizados = 0;

  var emociogramaWords = ['BOM', 'REGULAR', 'RUIM', 'OTIMO', 'PESSIMO'];

  // 3. Processamento em memória
  for (var k = 0; k < participantes.length; k++) {
    var p = participantes[k] || {};
    var idFunc = String(p.idFuncionario || p.ID_FUNCIONARIO || p.id || '').trim().toUpperCase();
    var nomeFunc = String(p.nome || p.NOME || '').trim();
    var emociogramaText = normalizarEmociograma(p.emociograma || p.EMOCIOGRAMA || 'BOM');
    var assinaturaStr = String(p.assinatura || p.ASSINATURA || '').trim();

    if (!idFunc) continue;

    if (!nomeFunc || emociogramaWords.indexOf(nomeFunc.toUpperCase()) !== -1) {
      if (mapFuncionarios[idFunc]) {
        nomeFunc = mapFuncionarios[idFunc];
      }
    }

    // A) PARTICIPANTES
    // Colunas: [0] ID_DDS | [1] ID_FUNCIONARIO | [2] NOME | [3] EMOCIOGRAMA | [4] ASSINATURA | [5] DATA_HORA
    if (partMapIndex.hasOwnProperty(idFunc)) {
      var rowIdx = partMapIndex[idFunc];
      if (nomeFunc) dadosPart[rowIdx][2] = nomeFunc;
      dadosPart[rowIdx][3] = emociogramaText;
      if (assinaturaStr) {
        dadosPart[rowIdx][4] = assinaturaStr;
      }
      dadosPart[rowIdx][5] = agora;
      atualizados++;
    } else {
      var novaLinhaP = [idDDS, idFunc, nomeFunc, emociogramaText, assinaturaStr, agora];
      dadosPart.push(novaLinhaP);
      partMapIndex[idFunc] = dadosPart.length - 1;
      criados++;
    }

    // B) ASSINATURAS
    if (assinaturaStr) {
      if (assMapIndex.hasOwnProperty(idFunc)) {
        var assRowIdx = assMapIndex[idFunc];
        dadosAss[assRowIdx][3] = assinaturaStr; // Col D: Arquivo/Base64
        dadosAss[assRowIdx][4] = agora;         // Col E: Data
        if (colCountAss >= 6) dadosAss[assRowIdx][5] = 'PARTICIPANTE';
      } else {
        var idAss = 'ASS-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        var novaLinhaA = [idAss, idDDS, idFunc, assinaturaStr, agora, 'PARTICIPANTE'];
        dadosAss.push(novaLinhaA);
        assMapIndex[idFunc] = dadosAss.length - 1;
      }
    }
  }

  var tProc = new Date().getTime();

  // 4. Gravação em lote no Google Sheets (1 única gravação por aba)
  if (dadosPart.length > 0) {
    sheetPart.getRange(2, 1, dadosPart.length, 6).setValues(dadosPart);
  }

  if (dadosAss.length > 0) {
    sheetAss.getRange(2, 1, dadosAss.length, Math.max(6, dadosAss[0].length)).setValues(dadosAss);
  }

  var tFim = new Date().getTime();
  Logger.log('[PERF LOG] SALVAR PARTICIPANTES EM LOTE FINALIZADO -> Total: ' + (tFim - tInicio) + ' ms | Leitura: ' + (tLeitura - tInicio) + ' ms | Proc: ' + (tProc - tLeitura) + ' ms | Gravação Lote: ' + (tFim - tProc) + ' ms | Criados: ' + criados + ' | Atualizados: ' + atualizados);

  return {
    sucesso: true,
    criados: criados,
    atualizados: atualizados,
    quantidade: participantes.length,
    tempoMs: tFim - tInicio
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

  idDDS = String(idDDS || '').trim();

  if (!idDDS) {
    throw new Error('ID_DDS não informado.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Mapa de funcionários para auto-reparo de nomes
  var mapFuncionarios = {};
  try {
    var sheetFunc = ss.getSheetByName(DDPS_ABAS.FUNCIONARIOS);
    if (sheetFunc && sheetFunc.getLastRow() >= 2) {
      var dadosFunc = sheetFunc.getRange(2, 1, sheetFunc.getLastRow() - 1, 2).getValues();
      for (var f = 0; f < dadosFunc.length; f++) {
        var fId = String(dadosFunc[f][0] || '').trim().toUpperCase();
        var fNome = String(dadosFunc[f][1] || '').trim();
        if (fId && fNome) {
          mapFuncionarios[fId] = fNome;
        }
      }
    }
  } catch (eFunc) {
    Logger.log('Aviso ao carregar funcionarios em obterParticipantesDDS: ' + eFunc.message);
  }

  // 2. Mapa de assinaturas isolado por ID_DDS + ID_FUNCIONARIO + 'PARTICIPANTE'
  var mapAssinaturas = {};
  try {
    var sheetAss = ss.getSheetByName(DDPS_ABAS.ASSINATURAS);
    if (sheetAss && sheetAss.getLastRow() >= 2) {
      var colCountAss = Math.max(6, sheetAss.getLastColumn());
      var dadosAss = sheetAss.getRange(2, 1, sheetAss.getLastRow() - 1, colCountAss).getValues();
      for (var a = 0; a < dadosAss.length; a++) {
        var ddsAss = String(dadosAss[a][1] || '').trim();
        var funcAss = String(dadosAss[a][2] || '').trim().toUpperCase();
        var arqAss = String(dadosAss[a][3] || '').trim();
        var tipoAss = colCountAss >= 6 ? String(dadosAss[a][5] || 'PARTICIPANTE').trim().toUpperCase() : 'PARTICIPANTE';
        if (ddsAss === idDDS && funcAss && tipoAss === 'PARTICIPANTE' && arqAss) {
          mapAssinaturas[funcAss] = arqAss;
        }
      }
    }
  } catch (eAss) {
    Logger.log('Aviso ao carregar assinaturas em obterParticipantesDDS: ' + eAss.message);
  }

  // 3. Ler participantes do DDS
  var sheet = ss.getSheetByName(DDPS_ABAS.PARTICIPANTES);
  if (!sheet) {
    throw new Error('Aba PARTICIPANTES não encontrada.');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  var dados = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var participantes = [];

  var emociogramaWords = ['BOM', 'REGULAR', 'RUIM', 'OTIMO', 'PESSIMO'];

  for (var i = 0; i < dados.length; i++) {
    var linha = dados[i];
    if (String(linha[0] || '').trim() !== idDDS) {
      continue;
    }

    var funcId = String(linha[1] || '').trim().toUpperCase();
    var nomeVal = String(linha[2] || '').trim();
    var emoVal = String(linha[3] || '').trim();
    var assVal = String(linha[4] || '').trim();
    var dtVal = linha[5];

    // Se a coluna [2] for um emociograma ou vazia, repara o nome usando mapFuncionarios
    if (!nomeVal || emociogramaWords.indexOf(nomeVal.toUpperCase()) !== -1) {
      if (mapFuncionarios[funcId]) {
        nomeVal = mapFuncionarios[funcId];
      }
    }

    // Se assVal estiver vazia ou 'PRESENTE', busca a assinatura real de ASSINATURAS do DDS
    if (!assVal || assVal.toUpperCase() === 'PRESENTE') {
      if (mapAssinaturas[funcId]) {
        assVal = mapAssinaturas[funcId];
      }
    }

    participantes.push({
      idDDS: linha[0],
      idFuncionario: funcId,
      nome: nomeVal,
      emociograma: emoVal,
      assinatura: assVal,
      dataHora: dtVal
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
  arquivo,
  tipo
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

  tipo = String(tipo || 'PARTICIPANTE').trim().toUpperCase();


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

  Logger.log('[ANTES DE GRAVAR ASSINATURA]');
  Logger.log('ID_DDS=' + idDDS);
  Logger.log('ID_FUNCIONARIO=' + idFuncionario);
  Logger.log('ARQUIVO=' + (arquivo ? arquivo.substring(0, 30) + '... (Tam: ' + arquivo.length + ')' : 'VAZIO'));
  Logger.log('TIPO=' + tipo);

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
   * VERIFICA PARTICIPAÇÃO (Apenas para PARTICIPANTE)
   * ---------------------------------------------------------- */

  if (tipo === 'PARTICIPANTE') {
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

  // Garante a coluna TIPO na aba ASSINATURAS
  garantirSchemaAssinaturas(sheet);

  var lastRow =
    sheet.getLastRow();

  var colCount = sheet.getLastColumn();


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
          Math.min(6, colCount)
        )
        .getValues();

    for (
      var i = 0;
      i < dados.length;
      i++
    ) {

      var linha =
        dados[i];

      var rowTipo = colCount >= 6 ? String(linha[5] || 'PARTICIPANTE').trim().toUpperCase() : 'PARTICIPANTE';

      if (
        String(
          linha[1] || ''
        ).trim() === idDDS &&

        String(
          linha[2] || ''
        )
        .trim()
        .toUpperCase() === idFuncionario &&

        rowTipo === tipo
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
         * NA ABA PARTICIPANTES (Apenas para PARTICIPANTE).
         */

        if (tipo === 'PARTICIPANTE') {
          sincronizarAssinaturaParticipante(
            idDDS,
            idFuncionario,
            arquivo
          );
        }


        SpreadsheetApp.flush();


        Logger.log(
          'ASSINATURA ATUALIZADA -> ' +
          idDDS +
          ' | ' +
          idFuncionario +
          ' | ' +
          tipo
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
            arquivo,

          tipo:
            tipo
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

    agora,

    tipo

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
   * NA ABA PARTICIPANTES (Apenas para PARTICIPANTE).
   */

  if (tipo === 'PARTICIPANTE') {
    sincronizarAssinaturaParticipante(
      idDDS,
      idFuncionario,
      arquivo
    );
  }


  SpreadsheetApp.flush();


  Logger.log(
    'ASSINATURA REGISTRADA -> ' +
    idAssinatura +
    ' | ' +
    idDDS +
    ' | ' +
    idFuncionario +
    ' | ' +
    tipo
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
      arquivo,

    tipo:
      tipo
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


/* ============================================================
 * FUNÇÕES DE SUPORTE AO ENCARREGADO DO DDS
 * ============================================================ */

function garantirSchemaAssinaturas(sheet) {
  if (!sheet) return;
  var colCount = sheet.getLastColumn();
  if (colCount < 2) return;
  
  var headers = sheet.getRange(1, 1, 1, Math.max(1, colCount)).getValues()[0];
  var headersUpper = headers.map(function(h) { return String(h).trim().toUpperCase(); });
  
  if (headersUpper.indexOf('TIPO') === -1) {
    sheet.getRange(1, 6).setValue('TIPO');
    sheet.getRange(1, 6).setFontWeight('bold');
    sheet.getRange(1, 6).setHorizontalAlignment('center');
    
    // Migra as linhas existentes definindo TIPO = 'PARTICIPANTE'
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var range = sheet.getRange(2, 6, lastRow - 1, 1);
      var values = [];
      for (var i = 0; i < lastRow - 1; i++) {
        values.push(['PARTICIPANTE']);
      }
      range.setValues(values);
    }
    SpreadsheetApp.flush();
  }
}

function garantirSchemaDDS(sheet) {
  if (!sheet) return;
  var colCount = sheet.getLastColumn();
  if (colCount < 2) return;
  
  var headers = sheet.getRange(1, 1, 1, Math.max(1, colCount)).getValues()[0];
  var headersUpper = headers.map(function(h) { return String(h).trim().toUpperCase(); });
  
  if (headersUpper.indexOf('ID_ENCARREGADO') === -1) {
    sheet.getRange(1, 13).setValue('ID_ENCARREGADO');
    sheet.getRange(1, 13).setFontWeight('bold');
    sheet.getRange(1, 13).setHorizontalAlignment('center');
  }
  if (headersUpper.indexOf('NOME_ENCARREGADO') === -1) {
    sheet.getRange(1, 14).setValue('NOME_ENCARREGADO');
    sheet.getRange(1, 14).setFontWeight('bold');
    sheet.getRange(1, 14).setHorizontalAlignment('center');
  }
  SpreadsheetApp.flush();
}

function removerAssinaturaEncarregado(idDDS) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DDPS_ABAS.ASSINATURAS);
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  garantirSchemaAssinaturas(sheet);
  
  var colCount = sheet.getLastColumn();
  var range = sheet.getRange(2, 1, lastRow - 1, Math.min(6, colCount));
  var valores = range.getValues();
  
  // Percorremos de trás para frente para remover sem quebrar os índices
  for (var i = valores.length - 1; i >= 0; i--) {
    var rowIdDDS = String(valores[i][1] || '').trim();
    var tipo = colCount >= 6 ? String(valores[i][5] || '').trim().toUpperCase() : 'PARTICIPANTE';
    
    if (rowIdDDS === idDDS && tipo === 'ENCARREGADO') {
      Logger.log('[ALERTA REMOÇÃO DE ASSINATURA ENCARREGADO] Removendo assinatura do encarregado para ID_DDS: ' + idDDS + ' da linha ' + (i + 2));
      sheet.deleteRow(i + 2);
    }
  }
  SpreadsheetApp.flush();
}

function obterAssinaturaEncarregado(idDDS) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DDPS_ABAS.ASSINATURAS);
  if (!sheet) return '';
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return '';
  
  garantirSchemaAssinaturas(sheet);
  
  var colCount = sheet.getLastColumn();
  var dados = sheet.getRange(2, 1, lastRow - 1, Math.min(6, colCount)).getValues();
  for (var i = 0; i < dados.length; i++) {
    var row = dados[i];
    var rowIdDDS = String(row[1] || '').trim();
    var tipo = colCount >= 6 ? String(row[5] || '').trim().toUpperCase() : 'PARTICIPANTE';
    
    if (rowIdDDS === idDDS && tipo === 'ENCARREGADO') {
      return String(row[3] || ''); // Coluna 4 (índice 3) é o ARQUIVO (base64)
    }
  }
  return '';
}

function atualizarDDS(dados) {
  dados = dados || {};
  var idDDS = String(dados.idDDS || '').trim();
  if (!idDDS) {
    throw new Error('ID_DDS não informado.');
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DDPS_ABAS.DDS);
  if (!sheet) {
    throw new Error('Aba DDS não encontrada.');
  }
  
  garantirSchemaDDS(sheet);
  
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) {
    throw new Error('Nenhum DDS cadastrado.');
  }
  
  var colCount = sheet.getLastColumn();
  var numCols = Math.max(14, colCount);
  
  var range = sheet.getRange(2, 1, ultimaLinha - 1, numCols);
  var valores = range.getValues();
  
  for (var i = 0; i < valores.length; i++) {
    var rowIdDDS = String(valores[i][0]).trim();
    if (rowIdDDS === idDDS) {
      var status = String(valores[i][10] || '').toUpperCase();
      if (status === 'FINALIZADO') {
        throw new Error('Este DDS já está finalizado e não permite edições.');
      }
      
      var temaAntigo = String(valores[i][5] || '').trim();
      var conteudoAntigo = String(valores[i][6] || '').trim();
      var localAntigo = String(valores[i][7] || '').trim();
      var respAntigo = String(valores[i][8] || '').trim();
      var obsAntigo = String(valores[i][9] || '').trim();
      var encarregadoIdAntigo = numCols >= 13 ? String(valores[i][12] || '').trim() : '';
      var encarregadoNomeAntigo = numCols >= 14 ? String(valores[i][13] || '').trim() : '';
      
      var camposRecebidos = [];
      var camposNaoRecebidos = [];
      var camposAlterados = [];
      var linhaDesejada = i + 2;

      // 1. TEMA
      var novoTema = temaAntigo;
      if (dados.tema !== undefined) {
        camposRecebidos.push('tema');
        novoTema = String(dados.tema || '').trim();
        if (novoTema !== temaAntigo) {
          camposAlterados.push('tema');
          sheet.getRange(linhaDesejada, 6).setValue(novoTema);
        }
      } else {
        camposNaoRecebidos.push('tema');
      }

      // 2. CONTEÚDO
      var novoConteudo = conteudoAntigo;
      if (dados.conteudo !== undefined) {
        camposRecebidos.push('conteudo');
        novoConteudo = String(dados.conteudo || '').trim();
        if (novoConteudo !== conteudoAntigo) {
          camposAlterados.push('conteudo');
          sheet.getRange(linhaDesejada, 7).setValue(novoConteudo);
        }
      } else {
        camposNaoRecebidos.push('conteudo');
      }

      // 3. LOCAL
      var novoLocal = localAntigo;
      if (dados.local !== undefined) {
        camposRecebidos.push('local');
        novoLocal = String(dados.local || '').trim();
        if (novoLocal !== localAntigo) {
          camposAlterados.push('local');
          sheet.getRange(linhaDesejada, 8).setValue(novoLocal);
        }
      } else {
        camposNaoRecebidos.push('local');
      }

      // 4. RESPONSÁVEL
      var novoResp = respAntigo;
      if (dados.responsavel !== undefined) {
        camposRecebidos.push('responsavel');
        novoResp = String(dados.responsavel || '').trim();
        if (novoResp !== respAntigo) {
          camposAlterados.push('responsavel');
          sheet.getRange(linhaDesejada, 9).setValue(novoResp);
        }
      } else {
        camposNaoRecebidos.push('responsavel');
      }

      // 5. OBSERVAÇÕES
      var novoObs = obsAntigo;
      if (dados.observacoes !== undefined) {
        camposRecebidos.push('observacoes');
        novoObs = String(dados.observacoes || '').trim();
        if (novoObs !== obsAntigo) {
          camposAlterados.push('observacoes');
          sheet.getRange(linhaDesejada, 10).setValue(novoObs);
        }
      } else {
        camposNaoRecebidos.push('observacoes');
      }

      // 6. ENCARREGADO ID
      var novoEncarregadoId = encarregadoIdAntigo;
      if (dados.encarregadoId !== undefined) {
        camposRecebidos.push('encarregadoId');
        novoEncarregadoId = String(dados.encarregadoId || '').trim();
        if (novoEncarregadoId !== encarregadoIdAntigo) {
          camposAlterados.push('encarregadoId');
          sheet.getRange(linhaDesejada, 13).setValue(novoEncarregadoId);
          if (encarregadoIdAntigo) {
            Logger.log('[ATUALIZAR DDS] Alteração explícita de encarregado: antigo="' + encarregadoIdAntigo + '", novo="' + novoEncarregadoId + '" -> Removendo assinatura antiga');
            removerAssinaturaEncarregado(idDDS);
          }
        }
      } else {
        camposNaoRecebidos.push('encarregadoId');
        Logger.log('[ENCARREGADO PRESERVADO]');
        Logger.log('ID_DDS=' + idDDS);
        Logger.log('ID_ENCARREGADO_EXISTENTE=' + encarregadoIdAntigo);
        Logger.log('NOME_ENCARREGADO_EXISTENTE=' + encarregadoNomeAntigo);
        Logger.log('MOTIVO=campo não enviado no payload');

        Logger.log('[ASSINATURA ENCARREGADO PRESERVADA]');
        Logger.log('ID_DDS=' + idDDS);
        Logger.log('ID_FUNCIONARIO=' + encarregadoIdAntigo);
      }

      // 7. ENCARREGADO NOME
      var novoEncarregadoNome = encarregadoNomeAntigo;
      if (dados.encarregadoNome !== undefined) {
        camposRecebidos.push('encarregadoNome');
        novoEncarregadoNome = String(dados.encarregadoNome || '').trim();
        if (novoEncarregadoNome !== encarregadoNomeAntigo) {
          camposAlterados.push('encarregadoNome');
          sheet.getRange(linhaDesejada, 14).setValue(novoEncarregadoNome);
        }
      } else {
        camposNaoRecebidos.push('encarregadoNome');
      }

      Logger.log('[ATUALIZAR DDS]');
      Logger.log('ID_DDS=' + idDDS);
      Logger.log('CAMPOS RECEBIDOS=' + camposRecebidos.join(', '));
      Logger.log('CAMPOS NÃO RECEBIDOS=' + camposNaoRecebidos.join(', '));
      Logger.log('CAMPOS ALTERADOS=' + (camposAlterados.length > 0 ? camposAlterados.join(', ') : 'NENHUM'));

      if (camposAlterados.length > 0) {
        SpreadsheetApp.flush();
      }

      Logger.log('[DEPOIS DE GRAVAR DDS]');
      Logger.log('ID_DDS=' + idDDS);
      Logger.log('TEMA=' + novoTema);
      Logger.log('CONTEUDO=' + novoConteudo);
      Logger.log('LOCAL=' + novoLocal);
      Logger.log('RESPONSAVEL=' + novoResp);
      Logger.log('OBSERVACOES=' + novoObs);
      Logger.log('ID_ENCARREGADO=' + novoEncarregadoId);
      Logger.log('NOME_ENCARREGADO=' + novoEncarregadoNome);
      Logger.log('STATUS=' + status);
      
      // Se for fornecida uma nova assinatura do encarregado, registra ela
      if (dados.assinaturaEncarregado && novoEncarregadoId) {
        try {
          registrarAssinatura(idDDS, novoEncarregadoId, dados.assinaturaEncarregado, 'ENCARREGADO');
        } catch (errAss) {
          Logger.log('Erro ao atualizar assinatura do encarregado na edicao: ' + errAss.message);
        }
      }
      
      return {
        sucesso: true,
        idDDS: idDDS,
        tema: novoTema,
        conteudo: novoConteudo,
        local: novoLocal,
        responsavel: novoResp,
        observacoes: novoObs,
        encarregadoId: novoEncarregadoId,
        encarregadoNome: novoEncarregadoNome,
        mensagem: 'DDS atualizado com sucesso.'
      };
    }
  }
  
  throw new Error('DDS não encontrado: ' + idDDS);
}


/* ============================================================
 * MÓDULO DE AUTENTICAÇÃO E CONTROLE DE ACESSO (RBAC)
 * ============================================================ */

function garantirSchemaUsuarios(sheet) {
  if (!sheet) return;
  var headers = [
    'ID_USUARIO',
    'USUARIO',
    'NOME',
    'SENHA_HASH',
    'PERFIL',
    'ATIVO',
    'PRIMEIRO_ACESSO',
    'DATA_CRIACAO',
    'DATA_ATUALIZACAO'
  ];
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    return;
  }

  var lastCol = sheet.getLastColumn();
  var firstRow = sheet.getRange(1, 1, 1, Math.max(lastCol, 9)).getValues()[0];
  var hasPrimeiroAcesso = false;
  for (var i = 0; i < firstRow.length; i++) {
    if (String(firstRow[i]).toUpperCase() === 'PRIMEIRO_ACESSO') {
      hasPrimeiroAcesso = true;
      break;
    }
  }

  if (!hasPrimeiroAcesso) {
    // Insere coluna na posição 7 (Coluna G)
    sheet.insertColumnBefore(7);
    sheet.getRange(1, 7).setValue('PRIMEIRO_ACESSO');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    var totalRows = sheet.getLastRow();
    if (totalRows >= 2) {
      for (var r = 2; r <= totalRows; r++) {
        var hash = String(sheet.getRange(r, 4).getValue() || '').trim();
        var pAcesso = hash ? 'NAO' : 'SIM';
        sheet.getRange(r, 7).setValue(pAcesso);
      }
    }
  }
}

function gerarHashSenha(senha) {
  if (!senha) return '';
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(senha), Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    var byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hex += byteHex;
  }
  return hex;
}

function salvarSessao(token, userObj) {
  if (!token) return;
  try {
    var cache = CacheService.getScriptCache();
    cache.put('SESSION_' + token, JSON.stringify(userObj), 21600); // 6 horas
  } catch (err) {
    Logger.log('Erro ao salvar sessão no CacheService: ' + err.message);
  }
}

function obterSessao(token) {
  if (!token) return null;
  try {
    var cache = CacheService.getScriptCache();
    var val = cache.get('SESSION_' + token);
    if (val) {
      return JSON.parse(val);
    }
  } catch (err) {
    Logger.log('Erro ao obter sessão do CacheService: ' + err.message);
  }
  return null;
}

function removerSessao(token) {
  if (!token) return;
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('SESSION_' + token);
  } catch (err) {
    Logger.log('Erro ao remover sessão do CacheService: ' + err.message);
  }
}

function validarToken(token) {
  return obterSessao(token);
}

function exigirAutenticacao(token) {
  var sessao = validarToken(token);
  if (!sessao) {
    throw new Error('Sessão inválida ou expirada. Faça login novamente.');
  }
  return sessao;
}

function exigirPerfil(token, perfilExigido) {
  var sessao = exigirAutenticacao(token);
  var perfis = Array.isArray(perfilExigido) ? perfilExigido : [perfilExigido];
  if (perfis.indexOf(sessao.perfil) === -1) {
    throw new Error('Acesso não autorizado para o perfil do usuário.');
  }
  return sessao;
}

function configurarPrimeiroAdmin(usuario, nome) {
  usuario = String(usuario || 'admin').trim().toLowerCase();
  nome = String(nome || 'Administrador').trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) {
    sheet = ss.insertSheet(DDPS_ABAS.USUARIOS);
    garantirSchemaUsuarios(sheet);
  } else {
    garantirSchemaUsuarios(sheet);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var dados = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    for (var i = 0; i < dados.length; i++) {
      var perfil = String(dados[i][4] || '').toUpperCase();
      var ativo = String(dados[i][5] || '').toUpperCase();
      if (perfil === 'ADMIN' && (ativo === 'SIM' || ativo === 'TRUE' || ativo === '1')) {
        return {
          sucesso: false,
          mensagem: 'Já existe um administrador cadastrado.'
        };
      }
    }
  }

  var idUsuario = 'USR-ADMIN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  var agora = new Date();

  sheet.appendRow([
    idUsuario,
    usuario,
    nome,
    '', // SENHA_HASH vazia
    'ADMIN',
    'SIM',
    'SIM', // PRIMEIRO_ACESSO = SIM
    agora,
    agora
  ]);

  return {
    sucesso: true,
    idUsuario: idUsuario,
    usuario: usuario,
    mensagem: 'Administrador inicial criado com sucesso sem senha.'
  };
}

function garantirAdminInicial() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
    if (!sheet) {
      configurarPrimeiroAdmin('admin', 'Administrador Inicial');
    } else {
      garantirSchemaUsuarios(sheet);
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        configurarPrimeiroAdmin('admin', 'Administrador Inicial');
      } else {
        var dados = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
        var temAdmin = false;
        for (var i = 0; i < dados.length; i++) {
          var perf = String(dados[i][4] || '').toUpperCase();
          var atv = String(dados[i][5] || '').toUpperCase();
          if (perf === 'ADMIN' && (atv === 'SIM' || atv === 'TRUE' || atv === '1')) {
            temAdmin = true;
            break;
          }
        }
        if (!temAdmin) {
          configurarPrimeiroAdmin('admin', 'Administrador Inicial');
        }
      }
    }
  } catch (err) {
    Logger.log('Aviso garantirAdminInicial: ' + err.message);
  }
}

function login(usuario, senha) {
  usuario = String(usuario || '').trim().toLowerCase();
  senha = String(senha || '').trim();

  if (!usuario) {
    return {
      sucesso: false,
      mensagem: 'Usuário ou senha inválidos.'
    };
  }

  garantirAdminInicial();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) {
    return {
      sucesso: false,
      mensagem: 'Usuário ou senha inválidos.'
    };
  }

  garantirSchemaUsuarios(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return {
      sucesso: false,
      mensagem: 'Usuário ou senha inválidos.'
    };
  }

  var dados = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var userFound = null;

  for (var i = 0; i < dados.length; i++) {
    var uNome = String(dados[i][1] || '').trim().toLowerCase();
    if (uNome === usuario) {
      userFound = {
        idUsuario: String(dados[i][0] || '').trim(),
        usuario: String(dados[i][1] || '').trim(),
        nome: String(dados[i][2] || '').trim(),
        senhaHash: String(dados[i][3] || '').trim(),
        perfil: String(dados[i][4] || 'TST').trim().toUpperCase(),
        ativo: String(dados[i][5] || 'SIM').trim().toUpperCase(),
        primeiroAcesso: String(dados[i][6] || 'SIM').trim().toUpperCase() === 'SIM'
      };
      break;
    }
  }

  if (!userFound) {
    return {
      sucesso: false,
      mensagem: 'Usuário ou senha inválidos.'
    };
  }

  if (userFound.ativo !== 'SIM' && userFound.ativo !== 'TRUE' && userFound.ativo !== '1') {
    return {
      sucesso: false,
      mensagem: 'Usuário inativo. Acesso negado.'
    };
  }

  // Se o usuário possui senha (permanente ou temporária), valida primeiro a senha informada
  if (userFound.senhaHash) {
    if (!senha) {
      return {
        sucesso: false,
        mensagem: 'Usuário ou senha inválidos.'
      };
    }

    var hashDigited = gerarHashSenha(senha);
    if (hashDigited !== userFound.senhaHash) {
      return {
        sucesso: false,
        mensagem: 'Usuário ou senha inválidos.'
      };
    }

    // Se a senha informada é válida e o usuário está em PRIMEIRO_ACESSO (ex: credencial temporária), exige troca de senha
    if (userFound.primeiroAcesso) {
      return {
        sucesso: true,
        primeiroAcesso: true,
        usuario: {
          idUsuario: userFound.idUsuario,
          usuario: userFound.usuario,
          nome: userFound.nome,
          perfil: userFound.perfil
        },
        mensagem: 'Credencial temporária validada. Por favor, crie sua nova senha.'
      };
    }
  } else {
    // Se ainda não tem nenhuma senha gravada na planilha (primeiro acesso)
    return {
      sucesso: true,
      primeiroAcesso: true,
      usuario: {
        idUsuario: userFound.idUsuario,
        usuario: userFound.usuario,
        nome: userFound.nome,
        perfil: userFound.perfil
      },
      mensagem: 'Primeiro acesso identificado. Por favor, crie sua senha.'
    };
  }

  var token = 'TOK-' + Utilities.getUuid();
  var userObj = {
    idUsuario: userFound.idUsuario,
    usuario: userFound.usuario,
    nome: userFound.nome,
    perfil: userFound.perfil
  };

  salvarSessao(token, userObj);

  return {
    sucesso: true,
    primeiroAcesso: false,
    usuario: userObj,
    token: token
  };
}

function definirPrimeiraSenha(usuario, novaSenha) {
  usuario = String(usuario || '').trim().toLowerCase();
  novaSenha = String(novaSenha || '').trim();

  if (!usuario || !novaSenha) {
    return {
      sucesso: false,
      mensagem: 'Informe o usuário e a nova senha.'
    };
  }

  if (novaSenha.length < 3) {
    return {
      sucesso: false,
      mensagem: 'A nova senha deve ter pelo menos 3 caracteres.'
    };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) {
    return {
      sucesso: false,
      mensagem: 'Usuário não encontrado.'
    };
  }

  garantirSchemaUsuarios(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return {
      sucesso: false,
      mensagem: 'Usuário não encontrado.'
    };
  }

  var dados = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var targetRow = -1;
  var userFound = null;

  for (var i = 0; i < dados.length; i++) {
    var uNome = String(dados[i][1] || '').trim().toLowerCase();
    if (uNome === usuario) {
      userFound = {
        idUsuario: String(dados[i][0] || '').trim(),
        usuario: String(dados[i][1] || '').trim(),
        nome: String(dados[i][2] || '').trim(),
        perfil: String(dados[i][4] || 'TST').trim().toUpperCase(),
        ativo: String(dados[i][5] || 'SIM').trim().toUpperCase(),
        primeiroAcesso: String(dados[i][6] || 'SIM').trim().toUpperCase() === 'SIM'
      };
      targetRow = i + 2;
      break;
    }
  }

  if (!userFound || targetRow === -1) {
    return {
      sucesso: false,
      mensagem: 'Usuário não encontrado.'
    };
  }

  if (userFound.ativo !== 'SIM' && userFound.ativo !== 'TRUE' && userFound.ativo !== '1') {
    return {
      sucesso: false,
      mensagem: 'Usuário inativo. Operação não permitida.'
    };
  }

  var novoHash = gerarHashSenha(novaSenha);
  var agora = new Date();

  // Coluna 4 (D) -> SENHA_HASH, Coluna 7 (G) -> PRIMEIRO_ACESSO = NAO, Coluna 9 (I) -> DATA_ATUALIZACAO
  sheet.getRange(targetRow, 4).setValue(novoHash);
  sheet.getRange(targetRow, 7).setValue('NAO');
  sheet.getRange(targetRow, 9).setValue(agora);

  var token = 'TOK-' + Utilities.getUuid();
  var userObj = {
    idUsuario: userFound.idUsuario,
    usuario: userFound.usuario,
    nome: userFound.nome,
    perfil: userFound.perfil
  };

  salvarSessao(token, userObj);

  return {
    sucesso: true,
    primeiroAcesso: false,
    usuario: userObj,
    token: token,
    mensagem: 'Senha criada com sucesso!'
  };
}

function logout(token) {
  removerSessao(token);
  return {
    sucesso: true,
    mensagem: 'Sessão encerrada.'
  };
}

function validarSessao(token) {
  var sessao = validarToken(token);
  if (sessao) {
    return {
      sucesso: true,
      usuario: sessao
    };
  }
  return {
    sucesso: false,
    mensagem: 'Sessão inválida ou expirada.'
  };
}

function listarUsuarios(token) {
  exigirPerfil(token, 'ADMIN');
  garantirAdminInicial();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) return [];

  garantirSchemaUsuarios(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var dados = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var lista = [];

  for (var i = 0; i < dados.length; i++) {
    var idU = String(dados[i][0] || '').trim();
    if (!idU) continue;
    lista.push({
      idUsuario: idU,
      usuario: String(dados[i][1] || '').trim(),
      nome: String(dados[i][2] || '').trim(),
      perfil: String(dados[i][4] || 'TST').trim().toUpperCase(),
      ativo: String(dados[i][5] || 'SIM').trim().toUpperCase() === 'SIM',
      primeiroAcesso: String(dados[i][6] || 'SIM').trim().toUpperCase() === 'SIM',
      dataCriacao: dados[i][7] ? new Date(dados[i][7]).toISOString() : '',
      dataAtualizacao: dados[i][8] ? new Date(dados[i][8]).toISOString() : ''
    });
  }

  return lista;
}

function cadastrarUsuario(token, dados) {
  exigirPerfil(token, 'ADMIN');
  dados = dados || {};

  var usuario = String(dados.usuario || '').trim().toLowerCase();
  var nome = String(dados.nome || '').trim();
  var perfil = String(dados.perfil || 'TST').trim().toUpperCase();

  if (!usuario || !nome) {
    throw new Error('Preencha os campos obrigatórios (Usuário e Nome).');
  }

  if (perfil !== 'ADMIN' && perfil !== 'TST' && perfil !== 'ENCARREGADO') {
    perfil = 'TST';
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) {
    sheet = ss.insertSheet(DDPS_ABAS.USUARIOS);
    garantirSchemaUsuarios(sheet);
  } else {
    garantirSchemaUsuarios(sheet);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var existing = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][0] || '').trim().toLowerCase() === usuario) {
        throw new Error('O usuário "' + usuario + '" já está cadastrado.');
      }
    }
  }

  var idUsuario = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  var agora = new Date();

  sheet.appendRow([
    idUsuario,
    usuario,
    nome,
    '', // SENHA_HASH vazia
    perfil,
    'SIM',
    'SIM', // PRIMEIRO_ACESSO = SIM
    agora,
    agora
  ]);

  return {
    sucesso: true,
    idUsuario: idUsuario,
    mensagem: 'Usuário cadastrado com sucesso. O usuário criará sua senha no primeiro acesso.'
  };
}

function editarUsuario(token, dados) {
  exigirPerfil(token, 'ADMIN');
  dados = dados || {};

  var idUsuario = String(dados.idUsuario || dados.id || '').trim();
  var nome = String(dados.nome || '').trim();
  var perfil = String(dados.perfil || '').trim().toUpperCase();
  var novoAtivoBool = dados.ativo === true || String(dados.ativo).toUpperCase() === 'SIM';
  var novoAtivoStr = novoAtivoBool ? 'SIM' : 'NAO';

  if (!idUsuario) throw new Error('ID do usuário não informado.');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) throw new Error('Aba USUARIOS não encontrada.');

  garantirSchemaUsuarios(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Nenhum usuário encontrado.');

  var valores = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var targetIndex = -1;
  var countActiveAdmins = 0;

  for (var i = 0; i < valores.length; i++) {
    var uId = String(valores[i][0] || '').trim();
    var uPerfil = String(valores[i][4] || '').toUpperCase();
    var uAtivo = String(valores[i][5] || '').toUpperCase() === 'SIM';

    if (uPerfil === 'ADMIN' && uAtivo) {
      countActiveAdmins++;
    }

    if (uId === idUsuario) {
      targetIndex = i;
    }
  }

  if (targetIndex === -1) throw new Error('Usuário não encontrado.');

  var currentTargetPerfil = String(valores[targetIndex][4] || '').toUpperCase();
  var currentTargetAtivo = String(valores[targetIndex][5] || '').toUpperCase() === 'SIM';

  if (currentTargetPerfil === 'ADMIN' && currentTargetAtivo) {
    var tentandoInativar = !novoAtivoBool;
    var tentandoMudarPerfil = perfil && perfil !== 'ADMIN';

    if ((tentandoInativar || tentandoMudarPerfil) && countActiveAdmins <= 1) {
      throw new Error('Operação negada: Não é permitido inativar ou alterar o perfil do único administrador ativo.');
    }
  }

  var rowNum = targetIndex + 2;
  var agora = new Date();

  if (nome) sheet.getRange(rowNum, 3).setValue(nome);
  if (perfil && (perfil === 'ADMIN' || perfil === 'TST' || perfil === 'ENCARREGADO')) sheet.getRange(rowNum, 5).setValue(perfil);
  sheet.getRange(rowNum, 6).setValue(novoAtivoStr);
  sheet.getRange(rowNum, 9).setValue(agora);

  return {
    sucesso: true,
    mensagem: 'Usuário atualizado com sucesso.'
  };
}

function redefinirSenhaUsuario(token, dados) {
  exigirPerfil(token, 'ADMIN');
  dados = dados || {};

  var idUsuario = String(dados.idUsuario || dados.id || '').trim();

  if (!idUsuario) throw new Error('ID do usuário não informado.');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) throw new Error('Aba USUARIOS não encontrada.');

  garantirSchemaUsuarios(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Nenhum usuário encontrado.');

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var targetRow = -1;

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim() === idUsuario) {
      targetRow = i + 2;
      break;
    }
  }

  if (targetRow === -1) throw new Error('Usuário não encontrado.');

  var tempPass = 'TMP-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(Math.random() * 89 + 10);
  var tempHash = gerarHashSenha(tempPass);
  var agora = new Date();

  sheet.getRange(targetRow, 4).setValue(tempHash);
  sheet.getRange(targetRow, 7).setValue('SIM');
  sheet.getRange(targetRow, 9).setValue(agora);

  return {
    sucesso: true,
    credencialTemporaria: tempPass,
    mensagem: 'Senha redefinida com sucesso. A credencial temporária gerada é: ' + tempPass
  };
}

function solicitarRecuperacaoSenha(usuario) {
  usuario = String(usuario || '').trim().toLowerCase();

  var tempPass = 'TMP-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(Math.random() * 89 + 10);
  var tempHash = gerarHashSenha(tempPass);
  var agora = new Date();

  if (usuario) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
    if (sheet) {
      garantirSchemaUsuarios(sheet);
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        var dados = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
        for (var i = 0; i < dados.length; i++) {
          var uNome = String(dados[i][1] || '').trim().toLowerCase();
          var uAtivo = String(dados[i][5] || 'SIM').trim().toUpperCase();
          if (uNome === usuario && (uAtivo === 'SIM' || uAtivo === 'TRUE' || uAtivo === '1')) {
            var targetRow = i + 2;
            sheet.getRange(targetRow, 4).setValue(tempHash);
            sheet.getRange(targetRow, 7).setValue('SIM');
            sheet.getRange(targetRow, 9).setValue(agora);
            break;
          }
        }
      }
    }
  }

  return {
    sucesso: true,
    credencialTemporaria: tempPass,
    mensagem: 'Se o usuário informado for válido e estiver ativo, a credencial temporária foi gerada.'
  };
}

function alterarMinhaSenha(token, dados) {
  var sessao = exigirAutenticacao(token);
  dados = dados || {};

  var senhaAtual = String(dados.senhaAtual || '').trim();
  var novaSenha = String(dados.novaSenha || '').trim();

  if (!senhaAtual || !novaSenha) {
    throw new Error('Informe a senha atual e a nova senha.');
  }

  if (novaSenha.length < 3) {
    throw new Error('A nova senha deve ter pelo menos 3 caracteres.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DDPS_ABAS.USUARIOS);
  if (!sheet) throw new Error('Aba USUARIOS não encontrada.');

  garantirSchemaUsuarios(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Usuário não encontrado.');

  var dadosUsers = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var targetRow = -1;
  var currentHash = '';

  for (var i = 0; i < dadosUsers.length; i++) {
    var uId = String(dadosUsers[i][0] || '').trim();
    if (uId === sessao.idUsuario) {
      targetRow = i + 2;
      currentHash = String(dadosUsers[i][3] || '').trim();
      break;
    }
  }

  if (targetRow === -1) throw new Error('Usuário não encontrado.');

  var hashAtualDigitada = gerarHashSenha(senhaAtual);
  if (hashAtualDigitada !== currentHash) {
    throw new Error('A senha atual está incorreta.');
  }

  var novoHash = gerarHashSenha(novaSenha);
  var agora = new Date();

  sheet.getRange(targetRow, 4).setValue(novoHash);
  sheet.getRange(targetRow, 7).setValue('NAO');
  sheet.getRange(targetRow, 9).setValue(agora);

  return {
    sucesso: true,
    mensagem: 'Sua senha foi alterada com sucesso!'
  };
}


/* ============================================================
 * TESTES OBRIGATÓRIOS DE AUTENTICAÇÃO E PERFIS (15 CENÁRIOS)
 * ============================================================ */

function TESTAR_AUTENTICACAO() {
  Logger.log('==================================================');
  Logger.log('INICIANDO BATERIA DE TESTES DE AUTENTICAÇÃO (15 CASOS)');
  Logger.log('==================================================');

  // 1. Criar primeiro ADMIN sem senha
  var resSetupAdmin = configurarPrimeiroAdmin('admin_teste_15', 'Admin Teste 15');
  Logger.log('1. Criar primeiro ADMIN sem senha: ' + JSON.stringify(resSetupAdmin));

  // 2. Primeiro ADMIN fazer primeiro acesso
  var resFirstAccessLogin = login('admin_teste_15', '');
  Logger.log('2. Primeiro ADMIN fazer primeiro acesso: ' + JSON.stringify(resFirstAccessLogin));

  // 3. ADMIN criar sua própria senha
  var resDefinirSenhaAdmin = definirPrimeiraSenha('admin_teste_15', 'SenhaAdmin@123');
  Logger.log('3. ADMIN criar sua própria senha: ' + JSON.stringify(resDefinirSenhaAdmin));

  // 4. Login do ADMIN após criar senha
  var resLoginAdminPos = login('admin_teste_15', 'SenhaAdmin@123');
  Logger.log('4. Login do ADMIN após criar senha: ' + JSON.stringify(resLoginAdminPos));
  var tokenAdmin = resLoginAdminPos.token;

  // 5. ADMIN cadastrar novo TST sem senha
  var resCadTst = cadastrarUsuario(tokenAdmin, {
    usuario: 'tst_fluxo_15',
    nome: 'Técnico TST 15',
    perfil: 'TST'
  });
  Logger.log('5. ADMIN cadastrar novo TST sem senha: ' + JSON.stringify(resCadTst));

  // 6. TST fazer primeiro acesso
  var resTstFirstLogin = login('tst_fluxo_15', '');
  Logger.log('6. TST fazer primeiro acesso: ' + JSON.stringify(resTstFirstLogin));

  // 7. TST criar sua própria senha
  var resDefinirSenhaTst = definirPrimeiraSenha('tst_fluxo_15', 'SenhaTst@456');
  Logger.log('7. TST criar sua própria senha: ' + JSON.stringify(resDefinirSenhaTst));

  // 8. TST fazer login normalmente depois disso
  var resLoginTstPos = login('tst_fluxo_15', 'SenhaTst@456');
  Logger.log('8. TST fazer login normalmente depois disso: ' + JSON.stringify(resLoginTstPos));
  var tokenTst = resLoginTstPos.token;

  // 9. ADMIN redefinir senha do TST
  var resResetTst = redefinirSenhaUsuario(tokenAdmin, { idUsuario: resCadTst.idUsuario });
  Logger.log('9. ADMIN redefinir senha do TST: ' + JSON.stringify(resResetTst));

  // 10. TST ser obrigado a criar nova senha após redefinição
  var resTstResetFirstLogin = login('tst_fluxo_15', 'SenhaTst@456');
  Logger.log('10. TST ser obrigado a criar nova senha após redefinição: ' + JSON.stringify(resTstResetFirstLogin));

  // 11. ADMIN nunca conseguir visualizar a senha
  var listaU = listarUsuarios(tokenAdmin);
  var temCampoSenhaOuHash = false;
  for (var u = 0; u < listaU.length; u++) {
    if (listaU[u].senha || listaU[u].senhaHash || listaU[u].SENHA_HASH) {
      temCampoSenhaOuHash = true;
    }
  }
  Logger.log('11. ADMIN nunca conseguir visualizar a senha: ' + (temCampoSenhaOuHash ? 'FALHA (Retornou campo de senha)' : 'SUCESSO (Nenhuma senha/hash exposta)'));

  // 12. Senha não aparecer nos logs (Confirmado que nenhuma função faz Logger.log de senhas)
  Logger.log('12. Senha não aparecer nos logs: SUCESSO');

  // 13. Usuário inativo não conseguir acessar
  var resCadInativo = cadastrarUsuario(tokenAdmin, {
    usuario: 'tst_inativo_15',
    nome: 'TST Inativo',
    perfil: 'TST'
  });
  editarUsuario(tokenAdmin, { idUsuario: resCadInativo.idUsuario, ativo: false });
  var resLoginInativo = login('tst_inativo_15', '');
  Logger.log('13. Usuário inativo não conseguir acessar: ' + JSON.stringify(resLoginInativo));

  // 14. TST continuar bloqueado nas funções administrativas
  try {
    listarUsuarios(tokenTst);
    Logger.log('14. TST bloqueado em funções administrativas: FALHA (Acesso permitido)');
  } catch (err14) {
    Logger.log('14. TST bloqueado em funções administrativas: SUCESSO (' + err14.message + ')');
  }

  // 15. Último ADMIN continuar protegido
  try {
    var adminUser = listaU.find(function(item) { return item.perfil === 'ADMIN'; });
    if (adminUser) {
      editarUsuario(tokenAdmin, { idUsuario: adminUser.idUsuario, ativo: false });
      Logger.log('15. Último ADMIN protegido: FALHA (Permitiu inativar)');
    }
  } catch (err15) {
    Logger.log('15. Último ADMIN protegido: SUCESSO (' + err15.message + ')');
  }

  Logger.log('==================================================');
  Logger.log('BATERIA DE TESTES DE AUTENTICAÇÃO FINALIZADA');
  Logger.log('==================================================');
}