          ) : (
            <>
              <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Klas</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Titularis</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Status</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-right">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGroups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-2">
                            <ChalkBoard className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen klassen gevonden</h3>
                          <p className="text-gray-500 mb-4 max-w-md mx-auto">
                            {searchTerm 
                              ? `Er zijn geen klassen gevonden die overeenkomen met "${searchTerm}". Probeer een andere zoekopdracht.` 
                              : 'Er zijn nog geen klassen aangemaakt.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      studentGroups.map((group: any) => (
                        <tr key={group.id} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{group.name}</div>
                            <div className="text-gray-500 text-xs">{group.academicYear} • {group.enrolledCount || 0} studenten</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {group.instructor || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={group.isActive ? "default" : "outline"} className={group.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                              {group.isActive ? "Actief" : "Inactief"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-blue-600"
                                onClick={() => handleEditStudentGroup(group)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Details bekijken</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-600"
                                onClick={() => handleEditStudentGroup(group)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Bewerken</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => handleDeleteStudentGroup(group)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Verwijderen</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>