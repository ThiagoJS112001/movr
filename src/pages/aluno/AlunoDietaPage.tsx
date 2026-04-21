import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Clock, Salad } from 'lucide-react';

export default function AlunoDietaPage() {
  const { user } = useAuth();
  const { dietAssignments, diets } = useApp();

  const myAssignment = dietAssignments.find((a) => a.studentId === user?.id);
  const diet = myAssignment ? diets.find((d) => d.id === myAssignment.dietId) : null;

  if (!myAssignment || !diet) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Minha Dieta</h1>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
          <Salad size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Nenhuma dieta atribuída ainda.</p>
          <p className="text-xs mt-1">Aguarde seu personal atribuir uma dieta.</p>
        </div>
      </div>
    );
  }

  // Sort meals by time
  const sortedMeals = [...diet.meals].sort((a, b) => a.time.localeCompare(b.time));

  const totals = diet.meals.reduce(
    (acc, m) => {
      m.foods.forEach((f) => {
        acc.cal += f.calories ?? 0;
        acc.prot += f.protein ?? 0;
        acc.carb += f.carbs ?? 0;
        acc.fat += f.fat ?? 0;
      });
      return acc;
    },
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  );

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Minha Dieta</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">{diet.name}</p>
      {diet.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm mb-5 border-l-4 border-emerald-400">
          {diet.description}
        </p>
      )}

      {/* Macro summary */}
      {totals.cal > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Calorias totais', value: `${totals.cal} kcal`, color: 'bg-orange-50 text-orange-600 border-orange-200' },
            { label: 'Proteína', value: `${totals.prot}g`, color: 'bg-blue-50 text-blue-600 border-blue-200' },
            { label: 'Carboidrato', value: `${totals.carb}g`, color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
            { label: 'Gordura', value: `${totals.fat}g`, color: 'bg-red-50 text-red-600 border-red-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl p-4 border ${color}`}>
              <p className="text-xs font-medium opacity-60">{label}</p>
              <p className="font-bold text-lg mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Meals */}
      <div className="flex flex-col gap-4">
        {sortedMeals.map((meal) => {
          const mealCal = meal.foods.reduce((a, f) => a + (f.calories ?? 0), 0);
          const mealProt = meal.foods.reduce((a, f) => a + (f.protein ?? 0), 0);
          return (
            <div key={meal.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Meal header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-600">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
                  <Clock size={13} className="text-white" />
                  <span className="text-white text-xs font-bold">{meal.time}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{meal.name}</p>
                  {(mealCal > 0 || mealProt > 0) && (
                    <p className="text-emerald-100 text-xs">
                      {mealCal > 0 && `${mealCal} kcal`}
                      {mealCal > 0 && mealProt > 0 && ' · '}
                      {mealProt > 0 && `${mealProt}g prot`}
                    </p>
                  )}
                </div>
              </div>

              {/* Meal notes */}
              {meal.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic px-4 pt-2">📌 {meal.notes}</p>
              )}

              {/* Foods */}
              <div className="px-4 py-3">
                {meal.foods.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum alimento cadastrado.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {meal.foods.map((food) => (
                      <div key={food.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{food.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{food.quantity}</p>
                        </div>
                        {(food.calories != null || food.protein != null) && (
                          <div className="text-right shrink-0">
                            {food.calories != null && (
                              <p className="text-xs font-semibold text-orange-500">{food.calories} kcal</p>
                            )}
                            <div className="flex gap-1.5 justify-end mt-0.5">
                              {food.protein != null && (
                                <span className="text-xs text-blue-500">{food.protein}g P</span>
                              )}
                              {food.carbs != null && (
                                <span className="text-xs text-yellow-600">{food.carbs}g C</span>
                              )}
                              {food.fat != null && (
                                <span className="text-xs text-red-400">{food.fat}g G</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
