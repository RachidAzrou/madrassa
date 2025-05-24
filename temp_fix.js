// Dit is een tijdelijke fix voor Programs.tsx
// Deze code moet worden gekopieerd naar het juiste bestand om de syntaxproblemen op te lossen

      {/* Vak Toevoegen Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Vak Toevoegen
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Vul de onderstaande velden in om een nieuw vak toe te voegen.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddDialogOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="px-6 py-4">
            <form onSubmit={handleSubmitProgram} className="space-y-4">
              <Tabs defaultValue="algemeen" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 p-1 bg-[#1e3a8a]/10 rounded-md">
                  <TabsTrigger value="algemeen" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <BookOpen className="h-4 w-4" />
                    <span>Algemeen</span>
                  </TabsTrigger>
                  <TabsTrigger value="curriculum" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <GraduationCap className="h-4 w-4" />
                    <span>Curriculum</span>
                  </TabsTrigger>
                  <TabsTrigger value="planning" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <Calendar className="h-4 w-4" />
                    <span>Planning</span>
                  </TabsTrigger>
                </TabsList>

                {/* Algemeen tabblad */}
                <TabsContent value="algemeen" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                          Naam van het vak <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          required
                          value={programFormData.name}
                          onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voer vaknaam in"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs font-medium text-gray-700">
                          Vakcode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="code"
                          required
                          value={programFormData.code}
                          onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voer vakcode in"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-xs font-medium text-gray-700">
                          Duur
                        </Label>
                        <Select
                          value={programFormData.duration.toString()}
                          onValueChange={(value) => setProgramFormData({ ...programFormData, duration: parseInt(value) })}
                        >
                          <SelectTrigger id="duration" className="mt-1 h-9 text-sm bg-white border-gray-200">
                            <SelectValue placeholder="Selecteer duur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Jaar</SelectItem>
                            <SelectItem value="2">Semester</SelectItem>
                            <SelectItem value="3">Trimester</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs font-medium text-gray-700">
                          Status
                        </Label>
                        <Select
                          value={programFormData.isActive ? "true" : "false"}
                          onValueChange={(value) => setProgramFormData({ ...programFormData, isActive: value === "true" })}
                        >
                          <SelectTrigger id="status" className="mt-1 h-9 text-sm bg-white border-gray-200">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Actief</SelectItem>
                            <SelectItem value="false">Inactief</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-xs font-medium text-gray-700">
                          Afdeling
                        </Label>
                        <Select
                          value={programFormData.department || ""}
                          onValueChange={(value) => setProgramFormData({ ...programFormData, department: value })}
                        >
                          <SelectTrigger id="department" className="mt-1 h-9 text-sm bg-white border-gray-200">
                            <SelectValue placeholder="Selecteer afdeling" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="islamitisch">Islamitisch</SelectItem>
                            <SelectItem value="arabisch">Arabisch</SelectItem>
                            <SelectItem value="taalencultuur">Taal & Cultuur</SelectItem>
                            <SelectItem value="wiskunde">Wiskunde</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2">
                        <Label htmlFor="description" className="text-xs font-medium text-gray-700">
                          Beschrijving
                        </Label>
                        <textarea
                          id="description"
                          value={programFormData.description || ""}
                          onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                          className="w-full min-h-[100px] p-2 mt-1 border rounded-md text-sm bg-white border-gray-200"
                          placeholder="Geef een korte beschrijving van de lesstof en leerdoelen van dit vak"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Curriculum tabblad */}
                <TabsContent value="curriculum" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">Curriculum details</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="instroomvereisten" className="text-xs font-medium text-gray-700">Instroomvereisten</Label>
                        <textarea
                          id="instroomvereisten"
                          placeholder="Beschrijf de vereiste kennis of vaardigheden voor dit vak"
                          className="w-full min-h-[80px] p-2 mt-1 border rounded-md text-sm bg-white border-gray-200"
                        />
                        <p className="text-xs text-gray-500">
                          Wat moeten studenten weten of kunnen voordat ze dit vak kunnen volgen?
                        </p>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="uitstroomvereisten" className="text-xs font-medium text-gray-700">Uitstroomvereisten</Label>
                        <textarea
                          id="uitstroomvereisten"
                          placeholder="Beschrijf wat studenten moeten beheersen na afronding van dit vak"
                          className="w-full min-h-[80px] p-2 mt-1 border rounded-md text-sm bg-white border-gray-200"
                        />
                        <p className="text-xs text-gray-500">
                          Welke competenties moeten studenten hebben verworven na afronding?
                        </p>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="leerplan" className="text-xs font-medium text-gray-700">Leerdoelen / Leerplan</Label>
                        <textarea
                          id="leerplan"
                          placeholder="Beschrijf de leerdoelen en het leerplan voor dit vak"
                          className="w-full min-h-[80px] p-2 mt-1 border rounded-md text-sm bg-white border-gray-200"
                        />
                        <p className="text-xs text-gray-500">
                          Wat zijn de belangrijkste leerdoelen en onderdelen van het leerplan?
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Planning tabblad */}
                <TabsContent value="planning" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">Klassen toewijzing</h3>
                      <div className="p-4 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-500">Selecteer één of meerdere klassen</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Klassen kunnen worden toegewezen</p>
                          <p className="text-xs text-gray-500">Klassen kunnen worden toegewezen nadat het vak is aangemaakt.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-300">
                  Annuleren
                </Button>
                <Button type="submit">
                  Opslaan
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
