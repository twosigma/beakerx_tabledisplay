# BeakerX: Beaker TableDisplay Extension for Jupyter

## Build and install (linux and mac)
```
conda env create -n beakerx_tabledisplay -f configuration.yml
conda activate beakerx_tabledisplay
# install beakerx_base (cd $PATH_TO_BEAKERX_BASE; pip install -e .)
(cd beakerx_tabledisplay; pip install -e .)
beakerx_tabledisplay install
```

## Build and install Jupyter Lab
```
conda env create -n beakerx_tabledisplay_lab -f configuration.yml
conda activate beakerx_tabledisplay_lab
# install beakerx_base (cd $PATH_TO_BEAKERX_BASE; pip install -e .)
(cd beakerx_tabledisplay; pip install -e .)
beakerx_tabledisplay install
jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build
jupyter labextension install beakerx_tabledisplay --no-build
jupyter lab build
```
