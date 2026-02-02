"""
Script para inserir colaboradores na tabela rh_colaboradores do Supabase.
Utiliza as credenciais do arquivo .env e lê os dados do arquivo JSON.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega as variáveis do arquivo .env
load_dotenv()

# Obtém as credenciais do .env
# Nota: Ajuste os nomes das variáveis conforme seu arquivo .env
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Credenciais do Supabase não encontradas no arquivo .env")

# Cria o cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def inserir_colaborador(colaborador: dict) -> dict:
    """
    Insere um único colaborador na tabela rh_colaboradores.
    
    Campos aceitos:
        - nome (obrigatório): str
        - cargo: str
        - departamento_id: uuid (string)
        - data_entrada: str (formato: YYYY-MM-DD)
        - data_saida: str (formato: YYYY-MM-DD)
        - etapa_id: str
        - foto_url: str
        - matricula: str
        - email: str
        - telefone: str
        - ativo: bool (default: True)
        - legacy_id: str (único)
    
    Returns:
        dict: Dados do colaborador inserido
    """
    response = supabase.table("rh_colaboradores").insert(colaborador).execute()
    return response.data


def inserir_colaboradores_em_lote(colaboradores: list) -> list:
    """
    Insere múltiplos colaboradores de uma vez.
    
    Args:
        colaboradores: Lista de dicionários com os dados dos colaboradores
    
    Returns:
        list: Lista com os dados dos colaboradores inseridos
    """
    response = supabase.table("rh_colaboradores").insert(colaboradores).execute()
    return response.data


# ============================================================
# DADOS DOS COLABORADORES PARA INSERÇÃO
# ============================================================

def carregar_json_colaboradores(caminho_arquivo: str = "colaboradores_supabase.json") -> list:
    """
    Carrega os dados dos colaboradores de um arquivo JSON.
    
    Args:
        caminho_arquivo: Caminho para o arquivo JSON (padrão: colaboradores_supabase.json)
    
    Returns:
        list: Lista de dicionários com os dados dos colaboradores
    
    Raises:
        FileNotFoundError: Se o arquivo não for encontrado
        json.JSONDecodeError: Se o arquivo não for um JSON válido
    """
    caminho = Path(caminho_arquivo)
    
    if not caminho.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho_arquivo}")
    
    if not caminho.is_file():
        raise ValueError(f"O caminho especificado não é um arquivo: {caminho_arquivo}")
    
    with open(caminho, 'r', encoding='utf-8') as arquivo:
        dados = json.load(arquivo)
    
    if not isinstance(dados, list):
        raise ValueError("O arquivo JSON deve conter uma lista de colaboradores")
    
    return dados


def preparar_dados_colaboradores(colaboradores_raw: list) -> list:
    """
    Remove campos que são gerados automaticamente pelo banco de dados.
    Mantém apenas os campos que devem ser inseridos manualmente.
    
    Args:
        colaboradores_raw: Lista de dicionários com dados brutos dos colaboradores
    
    Returns:
        list: Lista de dicionários com dados preparados para inserção
    """
    colaboradores_preparados = []
    for colab in colaboradores_raw:
        # Remove campos gerados automaticamente
        colab_limpo = {k: v for k, v in colab.items() 
                      if k not in ['criado_em', 'atualizado_em']}
        colaboradores_preparados.append(colab_limpo)
    return colaboradores_preparados


# ============================================================
# CONFIGURAÇÃO DO ARQUIVO JSON
# ============================================================
ARQUIVO_JSON_COLABORADORES = "colaboradores_supabase.json"


if __name__ == "__main__":
    import time
    import sys
    from datetime import datetime
    
    def log(mensagem: str, nivel: str = "INFO"):
        """Função de log com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] [{nivel}] {mensagem}")
    
    def separador(titulo: str = ""):
        """Imprime um separador visual"""
        if titulo:
            print(f"\n{'='*60}")
            print(f"  {titulo}")
            print(f"{'='*60}")
        else:
            print(f"{'-'*60}")
    
    # Início do processo
    separador("INICIANDO IMPORTAÇÃO DE COLABORADORES")
    inicio_total = time.time()
    
    # Verificação das credenciais
    log("Verificando credenciais do Supabase...")
    log(f"  URL: {SUPABASE_URL[:50]}..." if SUPABASE_URL else "  URL: NÃO ENCONTRADA")
    log(f"  KEY: {SUPABASE_KEY[:20]}..." if SUPABASE_KEY else "  KEY: NÃO ENCONTRADA")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("Credenciais inválidas! Verifique o arquivo .env", "ERRO")
        sys.exit(1)
    
    log("Credenciais válidas!", "OK")
    
    # Carregamento do arquivo JSON
    separador("CARREGANDO ARQUIVO JSON")
    log(f"Arquivo: {ARQUIVO_JSON_COLABORADORES}")
    
    try:
        inicio_carregamento = time.time()
        COLABORADORES_JSON = carregar_json_colaboradores(ARQUIVO_JSON_COLABORADORES)
        tempo_carregamento = time.time() - inicio_carregamento
        log(f"Arquivo carregado com sucesso em {tempo_carregamento:.3f} segundos", "OK")
        log(f"Total de colaboradores no arquivo: {len(COLABORADORES_JSON)}")
    except FileNotFoundError as e:
        log(f"Arquivo não encontrado: {e}", "ERRO")
        log(f"Certifique-se de que o arquivo '{ARQUIVO_JSON_COLABORADORES}' existe no diretório atual", "ERRO")
        sys.exit(1)
    except json.JSONDecodeError as e:
        log(f"Erro ao decodificar JSON: {e}", "ERRO")
        log("Verifique se o arquivo contém um JSON válido", "ERRO")
        sys.exit(1)
    except Exception as e:
        log(f"Erro ao carregar arquivo: {type(e).__name__}: {e}", "ERRO")
        sys.exit(1)
    
    # Preparação dos dados
    separador("PREPARAÇÃO DOS DADOS")
    log("Removendo campos gerados automaticamente (criado_em, atualizado_em)...")
    
    colaboradores_preparados = preparar_dados_colaboradores(COLABORADORES_JSON)
    
    log(f"Colaboradores preparados: {len(colaboradores_preparados)}", "OK")
    
    # Listagem dos colaboradores a serem inseridos
    separador("LISTA DE COLABORADORES PARA INSERÇÃO")
    for i, colab in enumerate(colaboradores_preparados, 1):
        log(f"  {i:3}. [{colab.get('matricula', 'N/A'):>4}] {colab['nome'][:45]:<45} | {colab.get('cargo', 'N/A')[:30]}")
    
    separador()
    log(f"Total: {len(colaboradores_preparados)} colaboradores prontos para inserção")
    
    # Inserção no banco de dados
    separador("INSERINDO NO BANCO DE DADOS")
    log(f"Conectando ao Supabase...")
    log(f"Tabela de destino: rh_colaboradores")
    log(f"Método: Inserção em lote (batch insert)")
    
    inicio_insercao = time.time()
    
    try:
        log("Enviando dados para o Supabase...", "AGUARDE")
        
        resultado = inserir_colaboradores_em_lote(colaboradores_preparados)
        
        tempo_insercao = time.time() - inicio_insercao
        
        separador("RESULTADO DA INSERÇÃO")
        log(f"Colaboradores inseridos com sucesso: {len(resultado)}", "SUCESSO")
        log(f"Tempo de inserção: {tempo_insercao:.2f} segundos")
        log(f"Média: {tempo_insercao/len(resultado)*1000:.2f}ms por registro")
        
        # Detalhes dos registros inseridos
        separador("DETALHES DOS REGISTROS INSERIDOS")
        for i, colab in enumerate(resultado, 1):
            log(f"  ✅ {i:3}. [{colab.get('matricula', 'N/A'):>4}] {colab['nome'][:40]:<40} | ID: {colab['id']}")
        
        # Estatísticas finais
        separador("ESTATÍSTICAS FINAIS")
        tempo_total = time.time() - inicio_total
        log(f"Total de registros processados: {len(COLABORADORES_JSON)}")
        log(f"Total de registros inseridos: {len(resultado)}")
        log(f"Taxa de sucesso: {(len(resultado)/len(COLABORADORES_JSON))*100:.1f}%")
        log(f"Tempo total de execução: {tempo_total:.2f} segundos")
        
        separador("PROCESSO FINALIZADO COM SUCESSO")
        
    except Exception as e:
        tempo_erro = time.time() - inicio_insercao
        
        separador("ERRO NA INSERÇÃO")
        log(f"Tempo até o erro: {tempo_erro:.2f} segundos", "ERRO")
        log(f"Tipo do erro: {type(e).__name__}", "ERRO")
        log(f"Mensagem: {str(e)}", "ERRO")
        
        # Detalhes do erro
        separador("DETALHES DO ERRO")
        import traceback
        traceback.print_exc()
        
        # Sugestões
        separador("POSSÍVEIS CAUSAS")
        log("  1. IDs duplicados - algum colaborador já existe no banco")
        log("  2. Credenciais inválidas ou expiradas")
        log("  3. Problema de conexão com o Supabase")
        log("  4. Violação de constraint (ex: departamento_id ou etapa_id inválido)")
        log("  5. Permissões insuficientes na tabela")
        
        separador("SUGESTÕES")
        log("  - Verifique se os IDs já existem no banco de dados")
        log("  - Tente remover o campo 'id' dos dados para gerar automaticamente")
        log("  - Verifique as políticas RLS (Row Level Security) do Supabase")
        log("  - Confirme as credenciais no arquivo .env")
        
        separador("PROCESSO FINALIZADO COM ERRO")
        sys.exit(1)
