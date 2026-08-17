export function createState(){return{inventory:{wood:100,logs:0,planks:24,stone:70,food:30},buildings:[],goods:[],carriers:[],segments:[],workers:[],builders:[],trees:[],rocks:[],crops:[],constructionSites:[],stats:{delivered:0},ids:{building:1,good:1,carrier:1,worker:1,builder:1}}}
export function nextId(state,key){return state.ids[key]++}
