# ResourceDetail Dependency Audit

Date: 2026-04-02

## Scope
- `frontend/src/pages/ResourceDetail.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/avatar.tsx`
- `frontend/src/lib/date.ts`
- `frontend/src/lib/resourceMetadata.ts`
- `frontend/src/lib/utils.ts`
- `frontend/src/constants/resourceTypes.ts`

## Findings
1. No direct `new <browser API>` usage was found in `ResourceDetail`, `Badge`, `AvatarImage`, metadata normalization helpers, or utility modules in scope.
2. The only `new` usage in the reviewed dependency chain is `new Date(value)` in `frontend/src/lib/date.ts`, which is standard and valid JavaScript date parsing.
3. No invalid class instantiation patterns were identified in the reviewed files.

## Command used
```bash
rg -n "\\bnew\\s+[A-Za-z_$][\\w$]*" frontend/src/pages/ResourceDetail.tsx frontend/src/components/ui/avatar.tsx frontend/src/components/ui/badge.tsx frontend/src/lib/date.ts frontend/src/lib/resourceMetadata.ts frontend/src/lib/utils.ts frontend/src/constants/resourceTypes.ts
```
