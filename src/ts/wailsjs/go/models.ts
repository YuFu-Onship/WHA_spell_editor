export namespace backend {
	
	export class HistoryResult {
	    spell?: model.Spell;
	    state: history.State;
	
	    static createFrom(source: any = {}) {
	        return new HistoryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.spell = this.convertValues(source["spell"], model.Spell);
	        this.state = this.convertValues(source["state"], history.State);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace history {
	
	export class State {
	    canUndo: boolean;
	    canRedo: boolean;
	
	    static createFrom(source: any = {}) {
	        return new State(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.canUndo = source["canUndo"];
	        this.canRedo = source["canRedo"];
	    }
	}

}

export namespace model {
	
	export class Pt {
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new Pt(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}
	export class Element {
	    kind: string;
	    id: string;
	    visible: boolean;
	    symbol: string;
	    x: number;
	    y: number;
	    radius: number;
	    weight: number;
	    color: string;
	    filled: boolean;
	    fillColor: string;
	    opening: number;
	    openingAngle: number;
	    size: number;
	    rotation: number;
	    amount: number;
	    spin: number;
	    strafe: number;
	    points: Pt[];
	
	    static createFrom(source: any = {}) {
	        return new Element(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kind = source["kind"];
	        this.id = source["id"];
	        this.visible = source["visible"];
	        this.symbol = source["symbol"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.radius = source["radius"];
	        this.weight = source["weight"];
	        this.color = source["color"];
	        this.filled = source["filled"];
	        this.fillColor = source["fillColor"];
	        this.opening = source["opening"];
	        this.openingAngle = source["openingAngle"];
	        this.size = source["size"];
	        this.rotation = source["rotation"];
	        this.amount = source["amount"];
	        this.spin = source["spin"];
	        this.strafe = source["strafe"];
	        this.points = this.convertValues(source["points"], Pt);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Seal {
	    id: string;
	    visible: boolean;
	    x: number;
	    y: number;
	    scale: number;
	    rotation: number;
	    elements: Element[];
	
	    static createFrom(source: any = {}) {
	        return new Seal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.visible = source["visible"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.scale = source["scale"];
	        this.rotation = source["rotation"];
	        this.elements = this.convertValues(source["elements"], Element);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Size {
	    w: number;
	    h: number;
	
	    static createFrom(source: any = {}) {
	        return new Size(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.w = source["w"];
	        this.h = source["h"];
	    }
	}
	export class Spell {
	    version: number;
	    name: string;
	    author: string;
	    description: string;
	    background: boolean;
	    backgroundColor: string;
	    color: string;
	    seals: Seal[];
	
	    static createFrom(source: any = {}) {
	        return new Spell(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.name = source["name"];
	        this.author = source["author"];
	        this.description = source["description"];
	        this.background = source["background"];
	        this.backgroundColor = source["backgroundColor"];
	        this.color = source["color"];
	        this.seals = this.convertValues(source["seals"], Seal);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

