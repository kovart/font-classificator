# Convolutional Neural Network for Font Classification

The idea of the project is to create a neural network to detect multiple styles in one font (Multi-Label Classification Problem). 
The styles I want to detect are 'Poster', 'Comic', 'Retro', 'Techno', 'Futuristic' etc.

![What I expect](demo.png)

## The problem

It's too hard to remember all the fonts you have locally on your computer if you're a designer and have a lot of them.
Sometimes it would be great to filter fonts by their stylistics like 'Poster', 'Retro' etc. 
But font files don't have this stylistic metadata so you cannot do it. **Graphic designers suffer**. 

## Project structure
```sh
    .
    ├── data                   # Scraped and generated data which is used to train models
    ├── scraper                # NodeJS Scraper – scrapes fonts from sites
    ├── generator              # NodeJS Generator – generates images to train the neural network
    ├── trainer                # Python CNN Trainer – trains models by generated images
    ├── models                 # Trained CNN models
    ├── Makefile
    └── README.md
```

## How it works?
The project contains three sub-projects: **`Scraper`**, **`Generator`** and **`Trainer`**. 
### [Scraper](./scraper)
**NodeJS** application that scrapes sites with fonts. It fetches information about name, description, **tags** and links to download. Then it downloads fonts into [data folder](./data) and saves map file with their metadata fetched from site. 
### [Generator](./generator)
**NodeJS** application that generates images with characters (in one image) for each font and creates a map file to link tags with the image. The neural network uses this images to train and valid itself.
> Generator also checks if the downloaded font has all drawn characters and misses it if not. 
### [Trainer](./trainer) 
**Python** project that uses Keras framework to build and train the neural network models. It uses real-time data augmentation to fight with overfitting and to avoid memory overloading. 

## Results
> The project is not developing now.

## Build
#### First step
You should install Python, PIP, VirtualEnv, NodeJS 10+, Python 3.6.1
#### Second step
Run make file:
```sh
$ cd <project_folder>
$ make
```
