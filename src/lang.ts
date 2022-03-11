interface ILang {
	en: string
	de?: string
}
export const langDict: { [index: string]: ILang } = {
	"unauth": {
		en: "unauth",
		de: "unauthoriziert"
	}
};

export const getLang = (key: string, lang?: keyof ILang): string => {
	if(langDict[key] && typeof langDict[key][lang] === "string"){
		return langDict[key][lang];
	}else{
		throw new Error(`LangDict <${key} not known`);
	}
};


getLang("1", "de");