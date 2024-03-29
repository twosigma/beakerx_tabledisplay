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

import argparse
import sys

import beakerx_tabledisplay

from .install import install, uninstall


def install_subparser(subparser):
    install_parser = subparser.add_parser('install', help='Installs BeakerX tabledisplay extensions')
    install_parser.set_defaults(func=install)
    install_parser.add_argument("--prefix",
                                help="location of the environment to install into",
                                default=sys.prefix)
    return subparser


def uninstall_subparser(subparser):
    uninstall_parser = subparser.add_parser('uninstall', help='Uninstalls BeakerX tabledisplay extensions')
    uninstall_parser.set_defaults(func=uninstall)
    uninstall_parser.add_argument("--prefix",
                                  help="location of the environment to uninstall from",
                                  default=sys.prefix)
    return subparser


def init_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument('-v', '--version',
                        action='version',
                        version=beakerx_tabledisplay.__version__)

    subparsers = parser.add_subparsers()
    install_subparser(subparsers)
    uninstall_subparser(subparsers)
    return parser


def beakerx_parse():
    parser = init_parser()
    args, jupyter_commands = parser.parse_known_args()
    if not jupyter_commands:
        args.func(args)
    else:
        parser.parse_args(jupyter_commands)
