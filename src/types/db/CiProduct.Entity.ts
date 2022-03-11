import { ICiEntity } from "./Ci.Entity";

export interface ICiProductEntity extends ICiEntity{
	ci_ciUid: ICiEntity["ciUid"]
	productUid: string
	name: string
	brand: string | null
	price: number | null
	description: string | null
	created: Date
	updated: Date
}