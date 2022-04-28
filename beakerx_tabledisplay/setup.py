#!/usr/bin/env python
# coding: utf-8

# Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
import sys
from pathlib import Path

import setuptools

HERE = Path(__file__).parent.resolve()

# Get the package info from package.json
pkg_json_path = HERE / "js/package.json"
pkg_json = json.loads(pkg_json_path.read_bytes())

# The name of the project
name = "beakerx_tabledisplay"

lab_path = (pkg_json_path.parent / pkg_json["jupyterlab"]["outputDir"]).resolve()
nb_path = HERE / name / "static"

# Representative files that should exist after a successful build
ensured_targets = [
    str(nb_path / "index.js"),
    str(lab_path / "package.json"),
]

labext_name = pkg_json["name"]
data_files_spec = [
    (
        "share/jupyter/nbextensions/beakerx_tabledisplay",
        str(nb_path.relative_to(HERE)),
        "**",
    ),
    (
        "share/jupyter/labextensions/%s" % labext_name,
        str(lab_path.relative_to(HERE)),
        "**",
    ),
    ("etc/jupyter/nbconfig/notebook.d", str(HERE), "beakerx_tabledisplay.json"),
]

version = (
    pkg_json["version"]
    .replace("-alpha.", "a")
    .replace("-beta.", "b")
    .replace("-rc.", "rc")
)

setup_args = dict(
    name=name,
    version=version,
    url=pkg_json["homepage"],
    author=pkg_json["author"]["name"],
    author_email=pkg_json["author"]["email"],
    description=pkg_json["description"],
    license=pkg_json["license"],
    license_file="LICENSE",
    long_description=pkg_json["description"],
    packages=setuptools.find_packages(),
    install_requires=["beakerx_base>=2.0.1", "numpy", "pandas"],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3",
    platforms="Linux, Mac OS X, Windows",
    keywords=["ipython", "jupyter", "widgets"],
    classifiers=[
        "License :: OSI Approved :: Apache Software License",
        "Development Status :: 5 - Production/Stable",
        "Framework :: IPython",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Multimedia :: Graphics",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Framework :: Jupyter",
    ],
    entry_points={
        "console_scripts": ["beakerx_tabledisplay = beakerx_tabledisplay:run"]
    },
)

try:
    from jupyter_packaging import wrap_installers, npm_builder, get_data_files

    post_develop = npm_builder(
        path=str(pkg_json_path.parent),
        build_cmd="build:labextension",
        source_dir=str(pkg_json_path.parent / "src"),
        build_dir=str(pkg_json_path.parent / "dist"),
        npm=["yarn"],
    )
    setup_args["cmdclass"] = wrap_installers(
        post_develop=post_develop, ensured_targets=ensured_targets
    )
    setup_args["data_files"] = get_data_files(data_files_spec)
except ImportError as e:
    import logging

    logging.basicConfig(format="%(levelname)s: %(message)s")
    logging.warning(
        "Build tool `jupyter-packaging` is missing. Install it with pip or conda."
    )
    if not ("--name" in sys.argv or "--version" in sys.argv):
        raise e

if __name__ == "__main__":
    setuptools.setup(**setup_args)
