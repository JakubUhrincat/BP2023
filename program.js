import fs from 'fs';
import { MongoClient } from 'mongodb';
import ObjectsToCsv from 'objects-to-csv';
import inquirer from 'inquirer';
import puppeteer from 'puppeteer';
import express from 'express';
import cors from 'cors';
import path from 'path';
import open from 'open';
import {parse} from 'csv-parse';
import Chart from 'chart.js/auto';
import { createCanvas} from 'canvas';
import prompts from 'prompts';


main();

async function main() {
  const choices = [
    { name: "Pravdepodobnostné vzorkovanie", value: "pravdepodobnostne" },
    { name: "Nepravdepodobnostné vzorkovanie", value: "nepravdepodobnostne" },
    { name: "Ukončiť program", value: "exit" }
  ];

  const { vyberHlavne } = await inquirer.prompt({
    type: "list",
    name: "vyberHlavne",
    message: "Vyber jednu z možností:",
    choices
  });

  switch (vyberHlavne) {
    case "pravdepodobnostne":
      console.log("Pravdepodobnostné vzorkovanie: \n");
      await PravdMenu();
      break;
    case "nepravdepodobnostne":
      console.log("Nepravdepodobnostné vzorkovanie \n");
      await NepravdMenu();
      break;
    case "exit":
      console.log("Program ukončený!");
      return;
  }
}

async function PravdMenu() {
  const choices = [
    { name: "Jednoduché náhodné vzorkovanie", value: "jednoduche" },
    { name: "Stratifikované náhodné vzorkovanie", value: "stratifikovane" },
    { name: "Systematické vzorkovanie", value: "systematicke" },
    { name: "Zhlukové vzorkovanie", value: "zhlukove" },
    { name: "Viacstupňové vzorkovanie", value: "viacstupnove" },
    { name: "Späť do hlavného menu", value: "spat" }
  ];

  const { vyberPravd } = await inquirer.prompt({
    type: "list",
    name: "vyberPravd",
    message: "Vyber jednu z možností:",
    choices
  });
switch (vyberPravd) {
  case "jednoduche":
    console.log("Jednoduché náhodné vzorkovanie");
    await simpleRandomSampling();
    break;
  case "stratifikovane":
    console.log("Stratifikované náhodné vzorkovanie: \n");
    await stratifiedRandomSampling();
    break;
  case "systematicke":
    console.log("Systematické vzorkovanie");
    await systematicSampling();
    break;
  case "zhlukove":
    console.log("Zhlukové vzorkovanie");
    await clusterSampling();
    break;
  case "viacstupnove":
    console.log("Viacstupňové vzorkovanie");
    await multiStageSampling();
    break;
  case "spat":
    await main();
    break;
  }
 }

 async function NepravdMenu() {
  const choices = [
    { name: "Vzorkovanie kvótou", value: "kvota" },
    { name: "Vzorkovanie snehovej gule", value: "snowball" },
    { name: "Vzorkovanie na základe pohodlnosti", value: "pohodlnost" },
    { name: "Účelové vzorkovanie", value: "ucelove" },
    { name: "Vzorkovanie na základe dobrovoľnosti", value: "dobrovolnost" },
    { name: "Späť do hlavného menu", value: "spat" }
  ];

  const { vyberNepravd } = await inquirer.prompt({
    type: "list",
    name: "vyberNepravd",
    message: "Vyber jednu z možností:",
    choices
  });

  switch (vyberNepravd) {
    case "kvota":
      console.log("Vzorkovanie kvótou");
      quotaSampling();
      break;
    case "snowball":
      console.log("Vzorkovanie snehovej gule \n");
      snowballSampling();
      break;
    case "pohodlnost":
      console.log("Vzorkovanie na základe pohodlnosti");
      convenienceSampling();
      break;
    case "ucelove":
      console.log("Účelové vzorkovanie");
      purposiveSampling();
      break;
    case "dobrovolnost":
      console.log("Vzorkovanie na základe dobrovoľnosti");
      voluntarySampling();
      break;
    case "spat":
      await main();
      break;
  }
}

async function loadDatabase() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('database');
  const collection = db.collection('dataset');
  return { client, db, collection };
}

async function getSampleSize(collection) {
  const totalCount = await collection.countDocuments();
  const sampleSizePercentage = 0.1;
  const sampleSize = Math.round(totalCount * sampleSizePercentage / 100);
  return sampleSize;
}

async function writeToCsvFile(data, filePath) {
const csv = new ObjectsToCsv(data);
await csv.toDisk(filePath, { append: false });
}

async function openHTML(csvFile) {
  const csvData = fs.readFileSync(csvFile, 'utf-8');

  const vzorkaImages = fs.readdirSync('./graphs')
  .filter(file => file.startsWith('vzorka-'))
  .map(file => `<div class="col"><img src="./graphs/${file}"></div>`)
  .join('');

const datasetImages = fs.readdirSync('./graphs')
  .filter(file => file.startsWith('dataset-'))
  .map(file => `<div class="col"><img src="./graphs/${file}"></div>`)
  .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Vzorka</title>
  <link rel="stylesheet" type="text/css" href="./style.css">
</head>
<body>
  <div class="container">
    <div class="content">
      <table>
      ${csvData.split('\n').map(row => `<tr>${row.split(',').map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
      </table>
      </div>
      <div class="row">
        <div class="col">
          ${vzorkaImages}
        </div>
        <div class="col">
          ${datasetImages}
        </div>
      </div>
    </div>
  </body>
</html>`;

  const htmlFile = './vzorka.html';

  fs.writeFileSync(htmlFile, html);

  const port = 3000;
  const app = express();
  app.use(cors());
  app.use(express.static(path.dirname(htmlFile)));

  const server = app.listen(port, () => {
    console.log('Server je spustený na porte 3000, stránka sa načítava a spustí sa onedlho');
    open(`http://localhost:${port}/vzorka.html`);
  });

  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/vzorka.html');
  await page.waitForTimeout(10000);
  await browser.close();

  server.close();
}

function calculateMin(data) {
  const numericData = data.filter(val => val !== '').map(Number);
  return Math.min(...numericData);
}

function calculateMax(data) {
  const numericData = data.filter(val => val !== '').map(Number);
  return Math.max(...numericData);
}

function calculateMean(data) {
  const numericData = data.filter(val => val !== '').map(Number);
  const sum = numericData.reduce((acc, val) => acc + val, 0);
  const mean = sum / numericData.length;
  return mean.toFixed(2);
}

function calculateMedian(data) {
  const numericData = data.filter(val => val !== '').map(Number);
  const sortedData = numericData.sort((a, b) => a - b);
  const middle = Math.floor(sortedData.length / 2);
  if (sortedData.length % 2 === 0) {
    return (sortedData[middle - 1] + sortedData[middle]) / 2;
  } else {
    return sortedData[middle].toFixed(2);
  }
}

async function plotCSV(csvFilePath, outputPath) {
  const csvData = await fs.promises.readFile(csvFilePath, 'utf-8');


  const records = await new Promise((resolve, reject) => {
      parse(csvData, { columns: true }, (err, records) => {
          if (err) reject(err);
          else resolve(records);
      });
  });


const numericColumns = Object.keys(records[0]).filter(column => {
return !isNaN(records[0][column]) && column !== '_id';
});


const stringColumns = Object.keys(records[0]).filter(column => {
return isNaN(records[0][column]) && column !== '_id';
});

const { xColumn } = await prompts({
  type: 'select',
  name: 'xColumn',
  message: 'Vyber názov stĺpca,ktorý bude zobrazený na osi X:',
  choices: [ ...numericColumns, ...stringColumns].map(column => ({ title: column, value: column })),
});


for (const yColumn of [...numericColumns, ...stringColumns]) {
if (numericColumns.includes(yColumn)) {

  const filteredRecords = records.filter(record => record[yColumn] !== '');


  const chartData = {
    labels: filteredRecords.map(record => record[xColumn]),
    datasets: [{
      label: `${yColumn}`,
      data: filteredRecords.map(record => record[yColumn]),
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(0, 0, 0, 0.7)',
      borderWidth: 1,
    }],
  };


  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        display: false,
        title: {
          display: true,
          text: xColumn,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yColumn,
        },
        suggestedMin: 0,
        suggestedMax: Math.ceil(Math.max(...chartData.datasets[0].data) / 10) * 10,
      },
    },
    plugins: {
      legend: {
        labels: {
          generateLabels: (chart) => {
            const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            const values = records.map(record => record[yColumn]);
            const min = calculateMin(values);
            const max = calculateMax(values);
            const median = calculateMedian(values);
            const mean = calculateMean(values);

            labels.push({
              text: `Min: ${min}`,
              fillStyle: 'rgba(0,0,0,0)',
              strokeStyle: 'rgba(0,0,0,0)',
            });
            labels.push({
              text: `Max: ${max}`,
              fillStyle: 'rgba(0,0,0,0)',
              strokeStyle: 'rgba(0,0,0,0)',
            });
            labels.push({
              text: `Median: ${median}`,
              fillStyle: 'rgba(0,0,0,0)',
              strokeStyle: 'rgba(0,0,0,0)',
            });
            labels.push({
              text: `Mean: ${mean}`,
              fillStyle: 'rgba(0,0,0,0)',
              strokeStyle: 'rgba(0,0,0,0)',
            });
            return labels;
          },
        },
      },
    },
  };
  const canvas = createCanvas(700, 600);
  const context = canvas.getContext('2d');
  const chart = new Chart(context, {
      type: 'line',
      data: chartData,
      options: chartOptions,
  });

  const buffer = canvas.toBuffer('image/png');
  const outputFilePath = `${outputPath}-${yColumn}.png`;
  await fs.promises.writeFile(outputFilePath, buffer);
  }
  else {
 const countMap = new Map();
 for (const record of records) {
     const value = record[yColumn];
     countMap.set(value, (countMap.get(value) || 0) + 1);
 }
 const sortedEntries = [...countMap.entries()].sort((a, b) => b[1] - a[1]);
 const topEntries = sortedEntries.slice(0, 10);



 const chartData = {
     labels: topEntries.map(entry => entry[0]),
     datasets: [{
         label: `${yColumn}`,
         data: topEntries.map(entry => entry[1]),
         backgroundColor: 'rgba(0,0,0,0.7)',
         borderColor: 'rgba(0,0,0,0.7)',
         borderWidth: 1,
     }],
 };


 const chartOptions = {
     responsive: true,
     scales: {
         x: {
             display: true,
             title: {
                 display: true,
                 text: yColumn,
             },
         },
         y: {
             display: true,
             title: {
                 display: true,
                 text: 'Počet výskytov',
             },
             suggestedMin: 0,
             suggestedMax: Math.ceil(Math.max(...chartData.datasets[0].data) / 10) * 10,
         },
     },
     plugins: {
         legend: {
             display: false,
         },
     },
 };
 const canvas = createCanvas(700, 600);
 const context = canvas.getContext('2d');
 const chart = new Chart(context, {
     type: 'bar',
     data: chartData,
     options: chartOptions,
 });


const buffer = canvas.toBuffer('image/png');
const outputFilePath = `${outputPath}-${yColumn}.png`;
await fs.promises.writeFile(outputFilePath, buffer);
}
}
}

async function simpleRandomSampling() {
  const { client, db, collection } = await loadDatabase();

  const sampleSize = await getSampleSize(collection);

  const sample = await collection.aggregate([
    { $sample: { size: sampleSize } },{ $project: { _id: 0 } }]).toArray();

  await writeToCsvFile(sample, 'vzorka.csv');
  await plotCSV('./vzorka.csv','./graphs/vzorka');
  await plotCSV('./dataset.csv','./graphs/dataset');
  await openHTML('./vzorka.csv');
  client.close();
  process.exit();
}

async function stratifiedRandomSampling() {
    const { client, db, collection } = await loadDatabase();

    const sampleSize = await getSampleSize(collection);

    const columns = await collection.findOne({}).then((doc) => Object.keys(doc));
    const userInput = await inquirer.prompt([
      {
        type: 'list',
        name: 'groupBy',
        message: 'Vyber stĺpec, podľa ktorého sa budú deliť vrstvy:',
        choices: columns,
      },
      {
        type: 'input',
        name: 'boundaries',
        message: 'Zadaj hranice (oddelené čiarkami):',
        validate: (value) => {
          const boundaries = value.trim().split(',');
          if (boundaries.length < 2) {
            return 'Zadaj aspoň 2 hranice';
          }
          for (const boundary of boundaries) {
            if (isNaN(Number(boundary))) {
              return 'Zadaj platné čísla hraníc';
            }
          }
          return true;
        },
      },
    ]);




    const groupSizes = await collection.aggregate([
        {
          $bucket: {
            groupBy: `$${userInput.groupBy}`,
            boundaries: userInput.boundaries.split(',').map(Number),
            default: "Unknown",
            output: {
              count: { $sum: 1 }
            }
          }
        },
        {
          $project: {
            category: {
              $concat: [
                { $cond: [{$eq: ["$_id", "Unknown"]}, "$_id", "" ] },
                { $cond: [{$ne: ["$_id", "Unknown"]}, { $toString: { $subtract: ["$_id", 100000] } }, ""] }
              ]
            },
            count: "$count",
            groupSize: { $ceil: { $multiply: [sampleSize, { $divide: ['$count', { $sum: '$count' }] }] } }
          }
        }
      ]).toArray();



    const groupSamples = await Promise.all(groupSizes.map(async ({ platform, groupSize }) => {
      const groupSample = await collection.aggregate([{ $match: { platform } }, { $sample: { size: groupSize } },{ $project: { _id: 0 } }]).toArray();
      return groupSample;
    }));


    const flatSamples = groupSamples.flat();
    const sample = flatSamples.sort(() => 0.5 - Math.random()).slice(0, sampleSize);

    await writeToCsvFile(sample, 'vzorka.csv');
    await plotCSV('./vzorka.csv','./graphs/vzorka');
    await plotCSV('./dataset.csv','./graphs/dataset');
    await openHTML('./vzorka.csv');
    client.close();
    process.exit();
}

async function systematicSampling() {
    const { client, db, collection } = await loadDatabase();

    const sampleSize = await getSampleSize(collection);
    const totalCount = await collection.countDocuments();

    const step = Math.floor(totalCount / sampleSize);
    const start = Math.floor(Math.random() * step);

    const sample = [];
    let i = start;
    while (sample.length < sampleSize && i < totalCount) {
        const doc = await collection.find().skip(i).limit(1).project({_id: 0}).toArray();
        sample.push(doc[0]);
      i += step;
    }

    await writeToCsvFile(sample, 'vzorka.csv');
    await plotCSV('./vzorka.csv', './graphs/vzorka');
    await plotCSV('./dataset.csv', './graphs/dataset');
    await openHTML('./vzorka.csv');

    client.close();
    process.exit();
}

async function clusterSampling() {
    const { client, db, collection } = await loadDatabase();


    const clusterSize = 10;

    const sampleSize = await getSampleSize(collection);

    const totalCount = await collection.countDocuments();
    const clusterCount = Math.ceil(totalCount / clusterSize);


    const clusterIndexes = Array.from({ length: clusterCount }, (_, i) => i);
    const selectedClusterIndexes = clusterIndexes.sort(() => 0.5 - Math.random()).slice(0, sampleSize / clusterSize);

    const sample = [];
    for (const clusterIndex of selectedClusterIndexes) {
      const docs = await collection.find().project({ _id: 0 }).skip(clusterIndex * clusterSize).limit(clusterSize).toArray();
      sample.push(...docs);
    }

    await writeToCsvFile(sample, 'vzorka.csv');
    await plotCSV('./vzorka.csv', './graphs/vzorka');
    await plotCSV('./dataset.csv', './graphs/dataset');
    await openHTML('./vzorka.csv');

    client.close();
    process.exit();
}

async function multiStageSampling() {
  const { client, db, collection } = await loadDatabase();

  const firstStageSampleSizeAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'firstStageSampleSize',
      message: 'Zadaj veľkost vzorky prvého stupňa:',
    },
  ]);
  const firstStageSampleSize = parseInt(firstStageSampleSizeAnswer.firstStageSampleSize);

  const firstStageSample = await simpleRandomSampling(await collection.find().project({ _id: 0 }).toArray(), firstStageSampleSize);

  const sampleSize = await getSampleSize(collection);

  const systematicSample = await systematicSampling(firstStageSample, sampleSize);

  await writeToCsvFile(systematicSample, 'vzorka.csv');
  await plotCSV('./vzorka.csv', './graphs/vzorka');
  await plotCSV('./dataset.csv', './graphs/dataset');
  await openHTML('./vzorka.csv');
  await client.close();
  process.exit();
}

async function quotaSampling() {
  const { client, db, collection } = await loadDatabase();


  const sampleSize = await getSampleSize(collection);

  const columns = await collection.findOne();
  const columnNames = Object.keys(columns);

  const columnsList = columnNames.map((columnName) => ({
    name: columnName,
    checked: false,
  }));

  const selectedColumns = await inquirer.prompt([
    {
      type: 'checkbox',
      message: 'Vyber stĺpce, pre ktorú budú určené kvóty :',
      name: 'columns',
      choices: columnsList,
      validate: (value) => {
        if (value.length === 0) {
          return 'Prosím vyber aspoň jeden stĺpec';
        }
        return true;
      },
    },
  ]);

  const strataQuotas = await inquirer.prompt(
    selectedColumns.columns.map((column) => ({
      type: 'number',
      message: `Zadaj kvótu pre ${column}:`,
      name: column,
      validate: (value) => {
        if (value <= 0 || !Number.isInteger(value)) {
          return 'Prosím zadaj kladné číslo';
        }
        return true;
      },
    }))
  );

  const strataSamplePromises = Object.entries(strataQuotas).map(([stratumField, quota]) => {
    return collection.aggregate([
      { $match: { [stratumField]: { $exists: true } } },
      { $project: { _id: 0 } },
      { $sample: { size: quota } },
    ]).toArray();
  });

  const strataSamples = await Promise.all(strataSamplePromises);
  const sample = strataSamples.flat().slice(0, sampleSize);

  await client.close();
  await writeToCsvFile(sample, 'vzorka.csv');
  await plotCSV('./vzorka.csv','./graphs/vzorka');
  await plotCSV('./dataset.csv','./graphs/dataset');
  await openHTML('./vzorka.csv');
  process.exit();
}

async function snowballSampling() {
  const { client, db, collection } = await loadDatabase();

  const sampleSize = await getSampleSize(collection);

  const columns = await collection.findOne({}, { projection: { _id: 0 } });
  const columnChoices = Object.keys(columns).map((col) => ({
    name: col,
    value: col,
  }));
  const startingPointColumnAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'startingPointColumn',
      message: 'Vyber stĺpec, ktorý slúži na hľadanie štartu:',
      choices: columnChoices,
    },
  ]);
  const startingPointColumn = startingPointColumnAnswer.startingPointColumn;

  const startingPointValueAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'startingPointValue',
      message: `Zadaj hodnotu pre stĺpec ${startingPointColumn}:`,
    },
  ]);
  const startingPointValue = startingPointValueAnswer.startingPointValue;
  const startingPointQuery = {};
  if (!isNaN(startingPointValue)) {
    startingPointQuery[startingPointColumn] = parseFloat(startingPointValue);
  } else {
    startingPointQuery[startingPointColumn] = startingPointValue;
  }

  const startingPoint = await collection.findOne(startingPointQuery, { projection: { _id: 0 } });

  const linkFieldChoices = Object.keys(startingPoint).filter(col => col !== '_id').map((col) => ({
    name: col,
    value: col,
  }));
  const linkFieldAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'linkField',
      message: 'Vyber stĺpec, podľa ktorého sa budú hľadať záznamy:',
      choices: linkFieldChoices,
    },
  ]);
  const linkField = linkFieldAnswer.linkField;

  const linkedDocs = await collection.find({ [linkField]: startingPoint[linkField] }).project({_id:0}).toArray();
  const sample = [startingPoint];
  const sampleIds = new Set([startingPoint[startingPointColumn]]);
  let queue = linkedDocs.filter((d) => d[startingPointColumn] !== startingPoint[startingPointColumn]);

  while (sample.length < sampleSize && queue.length > 0) {
    const doc = queue.shift();
    const linkQueryValue = isNaN(doc[linkField]) ? doc[linkField] : parseFloat(doc[linkField]);
    const linkQuery = { [linkField]: linkQueryValue };
    const sameLinkedDocs = await collection.find(linkQuery).project({_id:0}).toArray();
    sameLinkedDocs.forEach((d) => {
      const sampleId = isNaN(d[startingPointColumn]) ? d[startingPointColumn] : parseFloat(d[startingPointColumn]);
      if (!sampleIds.has(sampleId)) {
        queue.push(d);
        if (sample.length < sampleSize) {
          sample.push(d);
        }
        sampleIds.add(sampleId);
      }
    });
  }

  await writeToCsvFile(sample, 'vzorka.csv');
  await plotCSV('./vzorka.csv', './graphs/vzorka');
  await plotCSV('./dataset.csv', './graphs/dataset');
  await openHTML('./vzorka.csv');
  await client.close();
  process.exit();
}

async function convenienceSampling() {
  const { client, db, collection } = await loadDatabase();

  const sampleSize = await getSampleSize(collection);

  const columns = await collection.findOne();

  const columnNames = Object.keys(columns);

  const columnsList = columnNames.map((columnName) => ({
    name: columnName,
    checked: false,
  }));

    const selectedColumn = await inquirer.prompt([
      {
        type: 'list',
        message: 'Vyber stĺpec pre kritérium:',
        name: 'criteriaColumn',
        choices: columnsList,
      }
    ]);

    const { criteriaColumn } = selectedColumn;
    const columnType = typeof columns[criteriaColumn];

    let criteriaValue;

    if (columnType === 'number') {
      const response = await inquirer.prompt([
        {
          type: 'number',
          message: `Zadaj hodnotu pre stĺpec ${criteriaColumn}:`,
          name: 'criteriaValue',
          validate: (value) => {
            if (!value) {
              return 'Prosím zadaj hodnotu';
            }
            return true;
          },
        },
      ]);
      criteriaValue = response.criteriaValue;
    } else {
      const response = await inquirer.prompt([
        {
          type: 'input',
          message: `Zadaj hodnotu pre stĺpec ${criteriaColumn}:`,
          name: 'criteriaValue',
        },
      ]);
      criteriaValue = response.criteriaValue;
    }

  const generateRandomIndices = (maxValue, sampleSize) => {
    const indices = new Set();
    const maxIndices = Math.min(maxValue, sampleSize);
    while (indices.size < maxIndices) {
      const index = Math.floor(Math.random() * maxValue);
      indices.add(index);
    }

    return Array.from(indices);
  };


let criteria={};
if (columnType === 'number') {
  criteria = { [criteriaColumn]: { $eq: criteriaValue } };
} else {
  criteria = { [criteriaColumn]: criteriaValue };
}


  const accessibleParticipants = await collection.find(criteria).project({_id:0}).toArray();
  const randomIndices = generateRandomIndices(accessibleParticipants.length, sampleSize);
  const sample = randomIndices.map(index => accessibleParticipants[index]);

  await writeToCsvFile(sample, 'vzorka.csv');
  await plotCSV('./vzorka.csv', './graphs/vzorka');
  await plotCSV('./dataset.csv', './graphs/dataset');
  await openHTML('./vzorka.csv');
  await client.close();
  process.exit();
}

async function purposiveSampling() {
  const { client, db, collection } = await loadDatabase();

  const sampleSize = await getSampleSize(collection);

  const columns = await collection.findOne();
  const columnNames = Object.keys(columns);

  const numericColumns = columnNames.filter(column => {
    const columnData = columns[column];
    return typeof columnData === 'number' || (typeof columnData === 'string' && !isNaN(columnData));
  });

  const selectedColumns = await inquirer.prompt([
    {
      type: 'checkbox',
      message: 'Vyber stĺpce, ktoré chcete zahrnúť do filtrovania:',
      name: 'columns',
      choices: numericColumns,
    },
  ]);

  const queries = {};
  for (const columnName of selectedColumns.columns) {
    const { operator } = await inquirer.prompt([
      {
        type: 'list',
        message: `Vyber operátor pre ${columnName}:`,
        name: 'operator',
        choices: [
          { name: 'rovná sa', value: '$eq' },
          { name: 'viac ako', value: '$gt' },
          { name: 'menej ako', value: '$lt' },
        ],
      },
    ]);

    const { value } = await inquirer.prompt([
      {
        type: 'number',
        message: `Zadaj hodnotu pre stĺpec ${columnName}:`,
        name: 'value',
      },
    ]);

    queries[columnName] = { [operator]: value };
  }

  const query = { $and: Object.entries(queries).map(([column, criteria]) => ({ [column]: criteria })) };


  const sample = await collection.find(query).project({_id:0}).limit(sampleSize).toArray();

  await writeToCsvFile(sample, 'vzorka.csv');
  await plotCSV('./vzorka.csv', './graphs/vzorka');
  await plotCSV('./dataset.csv', './graphs/dataset');
  await openHTML('./vzorka.csv');
  await client.close();
  process.exit();
}

async function voluntarySampling() {
  const { client, db, collection } = await loadDatabase();

  const sampleSize = await getSampleSize(collection);

  const columns = await collection.findOne();
  const columnChoices = Object.keys(columns).filter(col => col !== '_id');
  const columnAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'column',
      message: 'Vyber stĺpec pre zadanie hodnôt:',
      choices: columnChoices,
    },
  ]);
  const column = columnAnswer.column;

  const valuesAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'values',
      message: `Zadaj hodnoty pre stĺpec ${column} (oddelené čiarkami):`,
    },
  ]);

  let values = valuesAnswer.values.split(',');
  if (!isNaN(parseFloat(values[0]))) {
    values = values.map(Number);
  }


  const sample = await collection
  .find({ [column]: { $in: values } })
  .project({ _id: 0 })
  .limit(sampleSize)
  .toArray();



  await writeToCsvFile(sample, 'vzorka.csv');
  await plotCSV('./vzorka.csv', './graphs/vzorka');
  await plotCSV('./dataset.csv', './graphs/dataset');
  await openHTML('./vzorka.csv');
  client.close();
  process.exit();
}
