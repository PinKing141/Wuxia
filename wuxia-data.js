"use strict";

window.WuxiaData = (() => {
  const SURNAMES = ["Li","Wang","Zhang","Liu","Chen","Yang","Zhao","Huang","Zhou","Wu","Xu","Sun","Ma","Zhu","Hu","Guo","He","Gao","Lin","Luo","Xiao","Tang","Feng","Xie","Ye","Shen","Qin","Bai","Duan","Murong","Ouyang","Sima","Shangguan","Nangong","Dugu"];
  const GIVEN = ["Yun","Feng","Chen","Ming","Yan","Xue","Qing","Lan","Yu","Han","Jian","Long","Yue","Ling","Ruo","Zhen","Fei","Tian","Ning","Wen","Mo","Zhuo","Heng","Lian","Xiao","Shuang","Jing","Hua","Cang","Wuji","Buxiu","Changan"];

  const TITLE_PRE = [
    ["Xue","血","Blood"],["Jian","剑","Sword"],["Dao","刀","Saber"],["Quan","拳","Fist"],
    ["Bing","冰","Ice"],["Huo","火","Fire"],["Lei","雷","Thunder"],["Gui","鬼","Ghost"],
    ["Mo","魔","Demon"],["Tian","天","Heaven"],["Ba","霸","Tyrant"],["Kuang","狂","Mad"],
    ["Du","毒","Poison"],["Ying","影","Shadow"],["Qing","青","Azure"],["Bai","白","White"],
    ["Jin","金","Golden"],["Tie","铁","Iron"],["Wu","无","Formless"],["Jue","绝","Severing"]
  ];
  const TITLE_SUF = [
    ["shen","神","God"],["wang","王","King"],["zun","尊","Venerable"],["mo","魔","Demon"],
    ["gui","鬼","Ghost"],["xia","侠","Hero"],["jun","君","Lord"],["ke","客","Wanderer"],
    ["xian","仙","Immortal"],["quan","拳","Fist"],["jian","剑","Blade"]
  ];

  const SECT_PRE = [
    ["Qingyun","青云","Azure Cloud"],["Huashan","华山","Mount Hua"],["Tianjian","天剑","Heaven Sword"],
    ["Xuetian","血天","Blood Heaven"],["Wandu","万毒","Myriad Poison"],["Riyue","日月","Sun-Moon"],
    ["Tianlong","天龙","Heaven Dragon"],["Bingpo","冰魄","Frost Soul"],["Heifeng","黑风","Black Wind"],
    ["Zixia","紫霞","Purple Mist"],["Kuanglei","狂雷","Roaring Thunder"],["Wuji","无极","Limitless"],
    ["Danxin","丹心","Crimson Heart"],["Luoxing","落星","Falling Star"],["Guigu","鬼谷","Ghost Valley"],
    ["Tiexue","铁血","Iron Blood"],["Wudu","五毒","Five Poison"],["Meihua","梅花","Plum Blossom"],
    ["Sanqing","三清","Three Pure Ones"],["Jinling","金陵","Golden Tomb"],["Xuehuo","雪火","Snowfire"],
    ["Shaolin","少林","Shaolin"],["Wudang","武当","Wudang"],["Emei","峨眉","Emei"]
  ];
  const SECT_SUF = [["pai","派","Sect"],["shijia","世家","Clan"],["men","门","Gate"],["jiao","教","Cult"],["bang","帮","Gang"],["gu","谷","Valley"],["zhuang","庄","Manor"],["cheng","城","Fortress"],["gong","宫","Palace"],["tang","堂","Hall"]];

  const ART_PRE = [
    ["Tianmo","天魔","Heavenly Demon"],["Taiji","太极","Supreme Polarity"],["Meihua","梅花","Plum Blossom"],
    ["Jiuyang","九阳","Nine Yang"],["Beiming","北冥","Northern Abyss"],["Xuehe","血河","Blood River"],
    ["Zixia","紫霞","Purple Mist"],["Jiuyin","九阴","Nine Yin"],["Wuxiang","无相","Formless"],
    ["Potian","破天","Heaven-Splitting"],["Miejue","灭绝","Annihilation"],["Bingpo","冰魄","Frost Soul"],
    ["Tianlei","天雷","Heaven's Thunder"],["Wanxiang","万象","Ten Thousand Forms"],["Jingang","金刚","Adamant"]
  ];
  const ART_SUF = [["Shengong","神功","Divine Art"],["Jianfa","剑法","Sword Art"],["Daofa","刀法","Saber Art"],["Quanfa","拳法","Fist Art"],["Zhangfa","掌法","Palm Art"],["Xinfa","心法","Heart Method"],["Qinggong","轻功","Lightness Skill"],["Zhifa","指法","Finger Art"],["Shenfa","身法","Movement Art"]];

  const REGIONS = ["the Central Plains (中原)","Jiangnan's misty rivers (江南)","the Bashu mountains (巴蜀)","the Northern Frontier (塞北)","the Eastern Sea cliffs (东海)","the Western Regions (西域)","the Imperial Capital (京城)","the Jade River delta (玉江)","the Ten-Thousand Peaks (万峰)","the Gobi marches (大漠)"];
  const WAR_NAMES = [["the Great Righteous-Demon War","正魔大战"],["the Blood Calamity of Jianghu","江湖血劫"],["the Ten-Year War","十年大战"],["the Struggle for All Under Heaven","天下争锋"],["the Demon Cult Rebellion","魔教之乱"],["the Green-Forest Chaos","绿林大乱"],["the War of Drawn Sabers","拔刀之乱"],["the Schism of the Nine Sects","九派分裂"]];

  const ALIGN = {
    righteous:{key:"righteous",label:"Righteous",zh:"正道",c:"var(--righteous)"},
    unorthodox:{key:"unorthodox",label:"Unorthodox",zh:"邪道",c:"var(--unorthodox)"},
    demonic:{key:"demonic",label:"Demonic",zh:"魔道",c:"var(--demonic)"},
    hermit:{key:"hermit",label:"Hermit",zh:"隐士",c:"var(--hermit)"}
  };

  const REALMS = ["Third-Rate","Second-Rate","First-Rate","Peak","Transcendent","Transformation Realm","Profound Realm","Life-Death Realm","Unity of Heaven and Man"];
  const REALM_ZH = ["三流","二流","一流","绝顶","超凡","化境","玄境","生死境","天人合一"];

  const PATH_FLAVOR = {
    righteous:{verb:"attained",via:["through disciplined meditation","by tempering the heart against desire","following the righteous canon","after years of quiet sword practice"]},
    unorthodox:{verb:"forced open",via:["by stealing a rival's inner force","through brilliant but perilous shortcuts","at the cost of a shortened life","with a pill of dubious origin"]},
    demonic:{verb:"seized",via:["by devouring the qi of the slain","through the blood of a hundred enemies","at the price of their remaining humanity","by feeding the demon art within"]},
    hermit:{verb:"quietly reached",via:["in solitude upon a nameless peak","having forgotten the affairs of men","while listening to mountain rain","after a lifetime of stillness"]}
  };

  return { SURNAMES, GIVEN, TITLE_PRE, TITLE_SUF, SECT_PRE, SECT_SUF, ART_PRE, ART_SUF, REGIONS, WAR_NAMES, ALIGN, REALMS, REALM_ZH, PATH_FLAVOR };
})();
