local p = {}

local paramsGrp = {
	cookable           = 'able',
	renewable          = 'able',
	canspawn           = 'can',
	gravity            = 'can',
	transparent        = 'can',
	['end support']    = 'some',
	flammable          = 'some',
	['nether support'] = 'some',

	dirt                 = true,
	light                = true,
	paid                 = true,
	['source available'] = true,
	['stackable']        = true,
	type                 = true
}

local i18n = {
	na = '?',

	yesAble = '可',
	yesCan  = 'する',
	yesSome = 'あり',
	noAble  = '不可',
	noCan   = 'しない',
	noSome  = 'なし',

	yesDirt       = '日光と土が必要',
	yesLight      = 'する（%s）',
	yesLightP     = 'する',
	yesPaid       = '有料',
	yesSource     = '[%s 可]',
	yesSourceP    = '可',
	yesStackable  = '可（%s）',
	yesStackableP = '可',
	noDirt        = '日光と砂が必要',
	noLight       = 'しない',
	noPaid        = '無料',
	noSource      = '不可',
	noStackable   = '不可',

	type = {
		armor                = '防具',
		block                = 'ブロック',
		['block entity']     = 'ブロックエンティティ',
		['building block']   = '建築ブロック',
		combat               = '戦闘',
		['decoration block'] = '装飾ブロック',
		decorations          = '装飾',
		dyes                 = '染料',
		entity               = 'エンティティ',
		fluid                = '液体',
		food                 = '食料',
		foodstuff            = '食料',
		item                 = 'アイテム',
		items                = 'アイテム',
		['non-solid block']  = '非個体ブロック',
		plant                = '植物',
		plants               = '植物',
		potions              = 'ポーション',
		projectile           = '発射物',
		['raw materials']    = '原材料',
		manufactured         = '加工品',
		['solid block']      = '個体ブロック',
		['tile entity']      = 'タイルエンティティ',
		tool                 = '道具',
		tools                = '道具',
		transport            = '運送',
		unknown              = '不明',
		vehicles             = '乗り物',
		weapon               = '武器',
		['wearable items']   = '装備品'
	}
}

function p.conv( f )
	local args = require( 'Module:ProcessArgs' ).merge( true )
	local param = args[ 1 ]
	local origVal = args[ 2 ]
	local val = origVal
	local result

	if not param or not origVal then
		if param == 'flammable' then
			return i18n.noSome
		elseif param and paramsGrp[ param:lower() ] then
			return i18n.na
		end
		return origVal or ''
	end

	param = param:lower()
	val   = val:lower()

	if i18n.type[ val ] then
		return i18n.type[ val ]
	end

	-- Normal yes/no check
	if paramsGrp[ param ] == 'able' then
		result = val == 'yes'
			and i18n.yesAble or val == 'no'
			and i18n.noAble  or origVal
	elseif paramsGrp[ param ] == 'can' then
		result = val == 'yes'
			and i18n.yesCan or val == 'no'
			and i18n.noCan  or origVal
	elseif paramsGrp[ param ] == 'some' then
		result = val == 'yes'
			and i18n.yesSome or val == 'no'
			and i18n.noSome  or origVal
	end

	if result then return result end

	-- Special yes/no check
	if param == 'dirt' then
		result = val == 'yes'
			and i18n.yesDirt or val == 'no'
			and i18n.noDirt  or origVal
	elseif param == 'light' then
		local lightLv = val:match( '^%d+$' ) or val:match( 'yes,?%s*%(?(%d+)%)?' )
		lightLv = tonumber( lightLv )

		result = ( lightLv and 0 < lightLv and lightLv < 16 )
			and i18n.yesLight:format( lightLv ) or val == 'yes'
			and i18n.yesLightP                  or ( val == 'no' or lightLv == 0 )
			and i18n.noLight                    or origVal
	elseif param == 'paid' then
		result = ( val == 'yes' or val == 'はい' )
			and i18n.yesPaid or ( val == 'no' or val == 'いいえ' )
			and i18n.noPaid  or origVal
	elseif param == 'source available' then
		local link = val:match( '^%[(%S+)%s' )
		local text = val:match( '%s(.+)%]$' )
		result = text == 'yes'
			and i18n.yesSource:format( link ) or val == 'yes'
			and i18n.yesSourceP               or val == 'no'
			and i18n.noSource                 or origVal
	elseif param == 'stackable' then
		local stackSize = val:match( 'yes%s*%((%d+)%)' )
		stackSize = stackSize or 0
		result = ( 0 < tonumber( stackSize ) and tonumber( stackSize ) <= 64 )
			and i18n.yesStackable:format( stackSize ) or val == 'yes'
			and i18n.yesStackableP                    or val == 'no'
			and i18n.noStackable                      or origVal
	end

	return result or origVal
end

return p