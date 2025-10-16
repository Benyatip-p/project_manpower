package models

type UserProfile struct {
	FirstName  string `json:"firstname"`
	LastName   string `json:"lastname"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	Department string `json:"department"`
	Section    string `json:"section"`
}
