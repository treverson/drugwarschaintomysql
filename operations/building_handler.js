
var db = require('../lib/db');
var player = require('./player_handler')

const building_handler = {
    AddLevelToBuilding: function (character, building_id, amount, cb) {
        var query = "SELECT * FROM character_buildings WHERE name = ?; \n\
            SELECT * FROM buildings";
        db.query(query, [character.name], function (err, [character_buildings, buildings]) {
            if (err) {
                console.log(err)
                cb(null)
            }
            else {
                var now = new Date();
                now = new Date(now.toISOString())
                var current_building = buildings.filter(function (item) { return item.building_id === building_id; });
                var current_building = current_building[0]
                var hq_level = character_buildings[0]['building_1_level']
                var building_level = character_buildings[0]['building_' + building_id + '_level'] + 1
                //CHECK HEADQUARTER LEVEL
                if (hq_level < building_level) {
                    cb('hq level to low')
                }
                if (character_buildings[0]['building_' + building_id + '_last_update'])
                    var building_last_update = character_buildings[0]['building_' + building_id + '_last_update']
                else {
                    building_last_update = now
                }
                //CHECK LAST UPDATE
                if (building_last_update > now) {
                    cb('need to wait')
                }
                // console.log('hq level ' + hq_level)
                // console.log('building level ' + building_level)
                // console.log('building last update ' + building_last_update)
                var timer = building_handler.calculateTime(hq_level, building_level, current_building)
                console.log(timer)
                var cost = building_handler.calculateCost(building_level, current_building)
                console.log(cost)
                //CHECK DRUGS COST BALANCE
                if (cost > character.drugs) {
                    return cb('not enough drugs')
                }
                if (current_building.production_rate > 0) {
                    var old_rate = building_handler.calculateProductionRate(building_level - 1, current_building)
                    var production_rate = building_handler.calculateProductionRate(building_level, current_building)
                    console.log(old_rate, production_rate)
                }
                var query;
                var now = new Date(now.getTime() + (timer * 1000)).toISOString().slice(0, 19).replace('T', ' ')
                if (current_building.production_type === 'weapon') {
                    character.weapon_production_rate = (character.weapon_production_rate - old_rate) + production_rate
                    character.drugs = character.drugs - cost
                    query = "UPDATE `character` SET weapon_production_rate=" + character.weapon_production_rate + ", drugs=" + character.drugs + " WHERE name='" + character.name + "'; \n\
                    UPDATE character_buildings SET building_"+ building_id + "_level=" + building_level + ", building_" + building_id + "_last_update='" + now + "'  WHERE name='" + character.name + "'";
                }
                else {
                    character.drug_production_rate = (character.drug_production_rate - old_rate) + production_rate
                    character.drugs = character.drugs - cost
                    query = "UPDATE `character` SET drug_production_rate=" + character.drug_production_rate + ", drugs=" + character.drugs + "  WHERE name='" + character.name + "'; \n\
                    UPDATE character_buildings SET building_"+ building_id + "_level=" + building_level + ", building_" + building_id + "_last_update='" + now + "'  WHERE name='" + character.name + "'";
                }
                db.query(query, function (err, result) {
                    if (err) cb(err);

                    else {
                        console.log("Upgraded character building :" + building_id + " for : " + character.name)
                        cb('success')
                    }
                })
            }
        })
    },
    calculateTime: function (hq_level, building_level, current_building) {
        console.log(current_building)
        return (current_building.building_coeff * 400) * (building_level ^ 2 / hq_level)

    },
    calculateCost: function (building_level, current_building) {
        return (current_building.building_base_price * (building_level * current_building.building_coeff))
    },
    calculateProductionRate: function (building_level, current_building) {
        return (current_building.production_rate * (building_level * current_building.building_coeff))
    },
}
module.exports = building_handler;