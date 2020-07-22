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

from ._version import version_info, __version__
from .commands import beakerx_parse
from .handlers import load_jupyter_server_extension
from .tabledisplay import *
from .tableitems import *
from .object import beakerx_tabledisplay
from beakerx_base import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'beakerx_tabledisplay',
        'require': 'beakerx_tabledisplay/extension'
    }]


def _jupyter_server_extension_paths():
    return [dict(module="beakerx_tabledisplay")]


def run():
    try:
        beakerx_parse()
    except KeyboardInterrupt:
        return 130
    return 0
