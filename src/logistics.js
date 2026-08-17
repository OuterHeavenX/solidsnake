export function segmentKey(a,b){return a.id<b.id?`${a.id}-${b.id}`:`${b.id}-${a.id}`}
export function goodsAtFlag(state,flagId){return state.goods.filter(g=>g.currentFlag===flagId&&!g.carrierId)}
export function cargoSummary(state,flagId){const counts={};for(const good of goodsAtFlag(state,flagId))counts[good.kind]=(counts[good.kind]||0)+1;return counts}
export function connectedSegments(state,flagId){return state.segments.filter(s=>s.a===flagId||s.b===flagId)}
export function enqueueGood(state,good){state.goods.push(good);return good}
