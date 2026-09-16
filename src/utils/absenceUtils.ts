/**
 * Função utilitária para sanitizar o motivo da ausência de colaboradores.
 * Garante que quando o usuário seleciona "OUTROS" e digita o motivo personalizado,
 * a string final salva seja APENAS o texto personalizado digitado.
 * 
 * Exemplo:
 * - "OUTROS - Consulta médica" -> "Consulta médica"
 * - "OUTROS Consulta médica" -> "Consulta médica"
 * - "Outros: Consulta médica" -> "Consulta médica"
 * - "Outros" -> "Outros"
 * - "Férias" -> "Férias"
 */
export function sanitizeMotivoAusencia(motivo?: string): string {
  if (!motivo) return '';
  let str = motivo.trim();
  if (/^outros$/i.test(str)) return 'Outros';
  
  // Remove prefixos como "OUTROS - ", "OUTROS : ", "OUTROS ", "Outros - ", etc.
  str = str.replace(/^outros\s*[-:\s]+\s*/i, '').trim();
  
  if (/^outros$/i.test(str)) return 'Outros';
  return str;
}
