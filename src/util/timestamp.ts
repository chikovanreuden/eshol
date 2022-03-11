import { intLength } from "./common";

export const getMaschineTimezoneOffset = (): number => {
	return new Date().getTimezoneOffset() / 60 * (-1);
};

export interface UniTimestamp {
	unix: number
	mysql: string
	js: string
}
export interface TimestampObject {
	timeIs: string
	arguments: any
	result: UniTimestamp
	timeWithOffset: number
	calculatedOffset: number
}

export const getTimestamp = (time: string | number, offset = 0): TimestampObject => {
	let timeIs;
	if(Number.isInteger(time)){
		timeIs = "int";
		if(intLength((<number>time)) === 10){
			time = (<number>time)*1000;
		}else if (intLength((<number>time)) === 13){
			time = (<number>time);
		}
		else{
			throw new Error("time needs to be int with 10 or 13 digits");
		}
	}else if(typeof time === "string" && time !== "now"){
		timeIs = "any_string";
		time = Date.parse(time);
		offset = 0;
	}else{
		timeIs = "now";
		time = new Date().getTime();
	}
	// calculate a offset using <int>offset
	// const offsetHours = offset;
	offset = ( offset*(60*60) ) * 1000;
	const calculatedOffset = offset;
	const timeWithOffset = time + offset;
	time = time + offset;

	// if(type === "unix") rtn.result.value = Math.floor(new Date(time).getTime() / 1000);
	// else if(type === "mysql") rtn.result.value = new Date(time).toISOString().slice(0, 19).replace('T', ' ');
	// else if(type === "js") rtn.result.value = new Date(time);
	// else throw new Error("type not supported");
	//console.log("time befor converting:", time);

	const rtn: TimestampObject= {
		timeIs,
		arguments: {time, offset},
		calculatedOffset,
		timeWithOffset,
		result: {
			unix: Math.trunc(new Date(time).getTime() / 1000),
			mysql: new Date(time).toISOString().slice(0, 19).replace('T', ' '),
			js: new Date(time).toISOString()
		}
	};
	//console.log(JSON.stringify(rtn, null, 2));
	return rtn;
};