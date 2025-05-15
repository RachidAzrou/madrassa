// Aangepaste onValueChange voor programId selecties
const handleProgramIdChange = (value) => {
  setStudentFormData({ 
    ...studentFormData, 
    programId: value && value !== "none" ? parseInt(value) : null 
  });
};

// Aangepaste onValueChange voor yearLevel selecties
const handleYearLevelChange = (value) => {
  setStudentFormData({ 
    ...studentFormData, 
    yearLevel: value && value !== "none" ? parseInt(value) : null 
  });
};
