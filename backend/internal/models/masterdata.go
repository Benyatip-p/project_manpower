package models

type MasterDataItem struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type MasterDataResponse struct {
	Departments     []MasterDataItem `json:"departments"`
	Positions       []MasterDataItem `json:"positions"`
	Sections        []MasterDataItem `json:"sections"`
	EmploymentTypes []MasterDataItem `json:"employmentTypes"`
	ContractTypes   []MasterDataItem `json:"contractTypes"`
	RequestReasons  []MasterDataItem `json:"requestReasons"`
	Genders         []MasterDataItem `json:"genders"`
	Nationalities   []MasterDataItem `json:"nationalities"`
	Experiences     []MasterDataItem `json:"experiences"`
	EducationLevels []MasterDataItem `json:"educationLevels"`
	Roles           []MasterDataItem `json:"roles"`
}