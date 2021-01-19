# Copyright 2019 TWO SIGMA OPEN SOURCE, LLC
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

"""Installs beakerx_tabledisplay into a Jupyter and Python environment."""

import subprocess

try:
    import jupyterlab
    LAB_VERSION=int(jupyterlab.__version__[0])
except:
    LAB_VERSION=None


def install(args):
    subprocess.check_call(["jupyter", "serverextension", "enable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    if LAB_VERSION is not None and LAB_VERSION != 3:
        subprocess.call(["jupyter", "labextension", "install", "@jupyter-widgets/jupyterlab-manager", "--no-build"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if LAB_VERSION == 1:
            subprocess.check_call(["jupyter", "labextension", "install", "@beakerx/beakerx-tabledisplay@2.0"])
        else:
            subprocess.check_call(["jupyter", "labextension", "install", "@beakerx/beakerx-tabledisplay@2.1"])


def uninstall(args):
    subprocess.check_call(["jupyter", "nbextension", "disable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "nbextension", "uninstall", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "serverextension", "disable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    if LAB_VERSION is not None:
        subprocess.call(["jupyter", "labextension", "uninstall", "beakerx-jupyterlab"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == "__main__":
    install()
