package services

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
)

func GetMasterDataByType(tableName string) ([]models.MasterDataItem, error) {
	var idCol, nameCol, tableAlias string

	switch tableName {
	case "department":
		idCol = "dept_id"
		nameCol = "dept_name"
		tableAlias = "departments"
	case "position":
		idCol = "pos_id"
		nameCol = "pos_name"
		tableAlias = "positions"
	case "section":
		idCol = "section_id"
		nameCol = "section_name"
		tableAlias = "sections"
	case "employment_type":
		idCol = "et_id"
		nameCol = "et_name"
		tableAlias = "employment_types"
	case "contract_type":
		idCol = "ct_id"
		nameCol = "ct_name"
		tableAlias = "contract_types"
	case "request_reason":
		idCol = "rr_id"
		nameCol = "rr_name"
		tableAlias = "request_reasons"
	case "gender":
		idCol = "gender_id"
		nameCol = "gender_name"
		tableAlias = "genders"
	case "nationality":
		idCol = "nat_id"
		nameCol = "nat_name"
		tableAlias = "nationalities"
	case "experience":
		idCol = "exp_id"
		nameCol = "exp_name"
		tableAlias = "experiences"
	case "education_level":
		idCol = "edu_id"
		nameCol = "edu_name"
		tableAlias = "education_levels"
	case "role":
		idCol = "role_id"
		nameCol = "role_name"
		tableAlias = "roles"
	default:
		return nil, errors.New("invalid master data table name")
	}

	query := fmt.Sprintf("SELECT %s, %s FROM %s ORDER BY %s ASC", idCol, nameCol, tableAlias, idCol)

	rows, err := database.DB.Query(query)
	if err != nil {
		log.Printf("Error querying %s: %v", tableAlias, err)
		return nil, err
	}
	defer rows.Close()

	var items []models.MasterDataItem
	for rows.Next() {
		var item models.MasterDataItem
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			log.Printf("Error scanning %s row: %v", tableAlias, err)
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func GetIDByName(tableName, name string) (int, error) {
	var idCol, nameCol, tableAlias string

	switch tableName {
	case "department":
		idCol = "dept_id"
		nameCol = "dept_name"
		tableAlias = "departments"
	case "position":
		idCol = "pos_id"
		nameCol = "pos_name"
		tableAlias = "positions"
	case "section":
		idCol = "section_id"
		nameCol = "section_name"
		tableAlias = "sections"
	case "employment_type":
		idCol = "et_id"
		nameCol = "et_name"
		tableAlias = "employment_types"
	case "contract_type":
		idCol = "ct_id"
		nameCol = "ct_name"
		tableAlias = "contract_types"
	case "request_reason":
		idCol = "rr_id"
		nameCol = "rr_name"
		tableAlias = "request_reasons"
	case "gender":
		idCol = "gender_id"
		nameCol = "gender_name"
		tableAlias = "genders"
	case "nationality":
		idCol = "nat_id"
		nameCol = "nat_name"
		tableAlias = "nationalities"
	case "experience":
		idCol = "exp_id"
		nameCol = "exp_name"
		tableAlias = "experiences"
	case "education_level":
		idCol = "edu_id"
		nameCol = "edu_name"
		tableAlias = "education_levels"
	case "role":
		idCol = "role_id"
		nameCol = "role_name"
		tableAlias = "roles"
	default:
		return 0, errors.New("invalid lookup table name")
	}

	// คืองการเปรียบเทียบชื่อแบบไม่สนใจตัวพิมพ์เล็ก-ใหญ่
	query := fmt.Sprintf("SELECT %s FROM %s WHERE UPPER(%s) = UPPER($1)", idCol, tableAlias, nameCol)
	
	var id int
	err := database.DB.QueryRow(query, name).Scan(&id)
	
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fmt.Errorf("%s with name '%s' not found", tableAlias, name)
		}
		log.Printf("Database error fetching ID for %s: %v", tableAlias, err)
		return 0, err
	}
	return id, nil
}