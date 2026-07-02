# Planos (Cursor / Superpowers)

Esta pasta guarda **planos aprovados** antes de execução em tarefas não triviais (features, bugs difíceis, refatorações com risco).

## Como usar

1. Em **Plan Mode**, fechar objetivo, ficheiros impactados, riscos e estratégia de testes.
2. Após revisão humana, guardar aqui um ficheiro `.md` com nome descritivo, por exemplo:
   - `feature-nome-curto.md`
   - `bugfix-area-descricao.md`
   - `refactor-modulo-alvo.md`
3. Só então executar implementação em passos pequenos, com testes verdes no fim.

Os planos são **histórico e contexto** para o projeto; podem ser referenciados no texto do PR ou em issues.
