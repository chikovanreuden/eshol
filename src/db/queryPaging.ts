export const page = (page: number, tableLimit: number): number => {
	if(page === 1) return 0;
	return (tableLimit * (page-1));
};

export default page;