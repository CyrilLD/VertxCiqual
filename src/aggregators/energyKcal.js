/**
 * Energy aggragator
 * Returns food energy, computed with formula : Kcal = 4*carbohydrates(g) + 4*proteins(g) + 9*lipids(g)
 * @module src/aggregators/energyKcal
 * @author Cyril LD
 */
 
export default (food) => {

  if (food.glucides_g100g !== undefined && food.glucides_g100g !== null
  && food.proteines_g100g !== undefined && food.proteines_g100g !== null
  && food.lipides_g100g !== undefined && food.lipides_g100g !== null) {
    return {
      alim_code: food.alim_code,
      alim_nom_fr: food.alim_nom_fr,
      kcal: (
        parseInt(food.glucides_g100g) * 4 +
        parseInt(food.proteines_g100g) * 4 +
        parseInt(food.lipides_g100g) * 9
      )
    };
  } else {
    return { error: 'missing datas to retrieve food energy' };
  }
}
