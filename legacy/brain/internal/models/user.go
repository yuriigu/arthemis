package models

// UserRole representa o perfil de autorização de um usuário dentro do Arthemis.
type UserRole string

const (
	UserRoleAdmin   UserRole = "admin"
	UserRoleManager UserRole = "manager"
	UserRoleVisitor UserRole = "visitor"
)

// User armazena o perfil de domínio do usuário gerenciado pelo arthemis-brain.
//
// A chave primária reutiliza intencionalmente o UUID gerado pelo auth do
// arthemis-edge como claim "sub" do JWT. Assim, a identidade do auth e a
// identidade do usuário no brain ficam alinhadas, sem criar um segundo ID
// sem relação direta.
type User struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	ProponentID uint      `gorm:"not null;index" json:"proponent_id"`
	Proponent   Proponent `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"proponent"`
	Username    string    `gorm:"type:varchar(150);not null;uniqueIndex" json:"username"`
	Email       string    `gorm:"type:varchar(150);not null;uniqueIndex" json:"email"`
	// Password não é gerenciado pelo brain; as credenciais ficam no auth do arthemis-edge.
	Password string   `gorm:"type:varchar(255);not null" json:"-"`
	Role     UserRole `gorm:"type:varchar(20);not null;default:'visitor';check:role IN ('admin','manager','visitor')" json:"role"`
}
