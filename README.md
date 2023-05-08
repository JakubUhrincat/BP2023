# Použitie:
    node program.js


# Prvotné spustenie:
Pred prvým spustením je nutné spustiť tento príkaz pre inštaláciu potrebných knižníc:

    npm install

# Opis:
Tento Node.js program umožňuje užívateľovi vytvoriť vzorku z určitého datasetu a následne vizuálne porovnať reprezentatívnosť vytvorenej vzorky oproti datasetu. Pre vytvorenie samotnej vzorky využíva program viacero metód vzorkovania, ktoré má užívateľ na výber. Tento program bol vytvorený za účelom bakalárskej práce.

# Obsah repozitára:
Tento repozitár pozostáva z:

**program.js** - samotný kód programu 

**dataset.csv** - csv súbor datasetu, obsahuje všetky dáta potrebné pre vytvorenie vzorky

**vzorka.csv*** - csv súbor vzorky, je vytvorený pomocou vzorkovacích metód po spustení programu

**vzorka.html*** - html súbor na účel vizualizácie dát, je vytvorený po spustení programu

**style.css** - css súbor, ktorý obsahuje css prvky pre vzhľad html stránky

**graphs*** - priečinok obsahujúci všetky grafy, ktoré sú vytvorené z príslušných dát po spustení programu

**output** - priečinok s ukážkou výstupov programu v pdf formáte

**ostatné súbory** - package.json,package-lock.json,node.modules

##### *Súbory s označením * nemajú konštantné dáta. Tieto súbory sa menia po spustení alebo ukončení programu.*


# Príklady použitia:
Niektoré metódy vyžadujú len voľbu primárneho stĺpca pri zobrazovaní, naopak niektoré potrebujú definovať kvóty či samotné hodnoty.

1. Vytvorenie vzorky použitím metódy jednoduchého náhodného vzorkovania

        node program.js

    Výstup:

        √ Vyber názov stĺpca,ktorý bude zobrazený na osi X: » temperature
        √ Vyber názov stĺpca,ktorý bude zobrazený na osi X: » temperature
        Server je spustený na porte 3000, stránka sa načítava a spustí sa onedlho

2. Vytvorenie vzorky pomocou metódy vzorkovania na základe pohodlnosti

        node program.js
    
    Výstup:

        ? Vyber stĺpec pre kritérium: o3
        ? Zadaj hodnotu pre stĺpec o3: 20
        √ Vyber názov stĺpca,ktorý bude zobrazený na osi X: » temperature
        √ Vyber názov stĺpca,ktorý bude zobrazený na osi X: » temperature
        Server je spustený na porte 3000, stránka sa načítava a spustí sa onedlho   

