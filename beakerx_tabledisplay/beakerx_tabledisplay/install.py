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


def install(args):
    subprocess.check_call(
        ["jupyter", "nbextension", "install", "beakerx_tabledisplay", "--py", "--symlink", "--sys-prefix"])
    subprocess.check_call(["jupyter", "nbextension", "enable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "serverextension", "enable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    if args.lab:
        subprocess.call(["jupyter", "labextension", "install", "@jupyter-widgets/jupyterlab-manager", "--no-build"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.check_call(["jupyter", "labextension", "install", "@beakerx/beakerx-tabledisplay"])


def uninstall(args):
    subprocess.check_call(["jupyter", "nbextension", "disable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "nbextension", "uninstall", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "serverextension", "disable", "beakerx_tabledisplay", "--py", "--sys-prefix"])
    subprocess.call(["jupyter", "labextension", "uninstall", "beakerx-jupyterlab"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == "__main__":
    install()
