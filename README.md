# Convolutional Neural Network for Font Classification

The idea of the project is to create a neural network to detect multiple styles in one font (Multi-Label Classification Problem). 
The styles I want to detect are 'Poster', 'Comic', 'Retro', 'Techno', 'Futuristic' etc.

![What I expect](demo.png)

## The problem

When you have many fonts on your computer, it's too hard to remember them all. 
Sometimes it would be great to filter fonts by its stylistic. 
But font files don't have stylistic metadata.
Hence, **graphic designers suffer**. 


### Project structure
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

## Results
The project is under development.

## Build
#### First step
You should install Python, PIP, VirtualEnv, NodeJS 10+, Python 3.6.1
#### Second step
All steps you should do is described in makefile.\
To run make file type:
```sh
$ cd <project_folder>
$ make
```
